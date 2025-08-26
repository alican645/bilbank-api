// scheduler.js
// Minimal, bağımlılıksız, drift-tolerant Job Scheduler
// CommonJS export: module.exports = { Scheduler }

const UNITS = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** "15m", "2h", "30s", number(ms) -> ms */
function parseEvery(every) {
  if (typeof every === 'number' && Number.isFinite(every) && every > 0) return every;
  const m = String(every).trim().match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!m) throw new Error(`Geçersiz 'every' değeri: ${every}`);
  return Number(m[1]) * UNITS[m[2].toLowerCase()];
}

function nowIso() { return new Date().toISOString(); }

class Scheduler {
  /**
   * @param {Object} [opts]
   * @param {Console} [opts.logger=console]
   */
  constructor({ logger = console } = {}) {
    this.logger = logger;
    /** @type {Map<string, any>} */
    this.jobs = new Map(); // name -> state
    this._running = false;
  }

  /**
   * Job ekle
   * @param {Object} job
   * @param {string} job.name - benzersiz isim
   * @param {Function} job.fn - async/ sync fonksiyon
   * @param {string|number} [job.every="1h"] - periyot (ms veya "15m")
   * @param {number} [job.jitterMs=0] - her çalıştırmaya 0..jitter arası ek gecikme
   * @param {boolean} [job.runAtStart=false] - scheduler başlar başlamaz çalıştır
   * @param {number} [job.timeoutMs=0] - 0 değilse; bu sürede bitmeyen çalışmaları uyarı logla
   */
  addJob({ name, fn, every = '1h', jitterMs = 0, runAtStart = false, timeoutMs = 0 }) {
    if (!name || typeof fn !== 'function') throw new Error('addJob: {name, fn} zorunlu');
    if (this.jobs.has(name)) throw new Error(`Job zaten var: ${name}`);
    const intervalMs = parseEvery(every);

    const state = {
      name, fn,
      intervalMs,
      jitterMs: Math.max(0, jitterMs|0),
      runAtStart: !!runAtStart,
      timeoutMs: Math.max(0, timeoutMs|0),
      lastStart: null,
      lastEnd: null,
      nextAt: null,
      timer: null,
      running: false,
      cancelled: false,
      _timeoutHandle: null,
    };

    this.jobs.set(name, state);
    if (this._running) this._schedule(state, true);
    return this;
  }

  /** Job kaldır */
  removeJob(name) {
    const s = this.jobs.get(name);
    if (!s) return false;
    if (s.timer) clearTimeout(s.timer);
    if (s._timeoutHandle) clearTimeout(s._timeoutHandle);
    s.cancelled = true;
    this.jobs.delete(name);
    this.logger.log(`[${nowIso()}] Job kaldırıldı: ${name}`);
    return true;
  }

  /** Tüm job’ları listele (durumla birlikte) */
  listJobs() {
    return [...this.jobs.values()].map(s => ({
      name: s.name,
      everyMs: s.intervalMs,
      jitterMs: s.jitterMs,
      runAtStart: s.runAtStart,
      running: s.running,
      lastStart: s.lastStart ? new Date(s.lastStart).toISOString() : null,
      lastEnd: s.lastEnd ? new Date(s.lastEnd).toISOString() : null,
      nextAt: s.nextAt ? new Date(s.nextAt).toISOString() : null,
    }));
  }

  /** Hemen çalıştır (planı bozmaz; sıradaki run yine planlandığı gibi olur) */
  async runNow(name) {
    const s = this.jobs.get(name);
    if (!s) throw new Error(`runNow: Job bulunamadı: ${name}`);
    await this._runOnce(s, /*manual=*/true);
  }

  /** Periyot / ayar değiştirip yeniden planla */
  rescheduleJob(name, opts = {}) {
    const s = this.jobs.get(name);
    if (!s) throw new Error(`rescheduleJob: Job bulunamadı: ${name}`);
    if (opts.every !== undefined) s.intervalMs = parseEvery(opts.every);
    if (opts.jitterMs !== undefined) s.jitterMs = Math.max(0, opts.jitterMs|0);
    if (opts.runAtStart !== undefined) s.runAtStart = !!opts.runAtStart;
    if (opts.timeoutMs !== undefined) s.timeoutMs = Math.max(0, opts.timeoutMs|0);

    if (s.timer) clearTimeout(s.timer);
    if (this._running) this._schedule(s, true);
    this.logger.log(`[${nowIso()}] Job yeniden planlandı: ${name}`);
  }

  /** Başlat */
  start() {
    if (this._running) return;
    this._running = true;
    for (const s of this.jobs.values()) this._schedule(s, true);
    this.logger.log(`[${nowIso()}] Scheduler başlatıldı. Job sayısı: ${this.jobs.size}`);
  }

  /** Durdur (timer’ları temizler) */
  stop() {
    this._running = false;
    for (const s of this.jobs.values()) {
      if (s.timer) clearTimeout(s.timer);
      if (s._timeoutHandle) clearTimeout(s._timeoutHandle);
      s.timer = null;
      s._timeoutHandle = null;
    }
    this.logger.log(`[${nowIso()}] Scheduler durduruldu.`);
  }

  // ---- iç işler ----
  _schedule(s, initial) {
    if (!this._running || s.cancelled) return;

    let delay = initial
      ? (s.runAtStart ? 0 : s.intervalMs)
      : s.intervalMs;

    if (s.jitterMs > 0) delay += Math.floor(Math.random() * s.jitterMs);

    s.nextAt = Date.now() + delay;

    if (s.timer) clearTimeout(s.timer);
    s.timer = setTimeout(() => this._runOnce(s, /*manual=*/false), delay);
  }

  async _runOnce(s, manual) {
    if (!this._running || s.cancelled) return;

    if (s.running) {
      // Çakışma engelle (concurrency = 1)
      this.logger.warn(`[${nowIso()}] Job zaten çalışıyor, atlandı: ${s.name}`);
      if (!manual) this._schedule(s, false);
      return;
    }

    s.running = true;
    s.lastStart = Date.now();
    this.logger.log(`[${nowIso()}] ➤ ÇALIŞTIR: ${s.name}${manual ? ' (manual)' : ''}`);

    // Opsiyonel "uzun sürüyor" uyarısı
    if (s.timeoutMs > 0) {
      s._timeoutHandle = setTimeout(() => {
        this.logger.warn(`[${nowIso()}] ⏰ Uzun sürüyor: ${s.name} (${s.timeoutMs}ms+)`);
      }, s.timeoutMs);
    }

    try {
      await Promise.resolve(s.fn());
      s.lastEnd = Date.now();
      this.logger.log(`[${nowIso()}] ✔ BİTTİ: ${s.name}`);
    } catch (err) {
      this.logger.error(
        `[${nowIso()}] ✖ HATA (${s.name}):`,
        (err && err.stack) || err
      );
      s.lastEnd = Date.now();
    } finally {
      s.running = false;
      if (s._timeoutHandle) { clearTimeout(s._timeoutHandle); s._timeoutHandle = null; }
      if (!manual) this._schedule(s, false);
    }
  }
}

module.exports = { Scheduler };
