// services/IntervalScheduler.js
/**
 * Basit tekrarlı görev zamanlayıcı
 * - Her X saniyede bir task çalıştırır
 * - Opsiyonel toplam çalışma süresi (forSeconds) veya maksimum tekrar (maxRuns) ile otomatik durur
 */
class IntervalScheduler {
  constructor() {
    /** @type {Map<string, { interval?: NodeJS.Timer, stopper?: NodeJS.Timer, runs: number, meta: any }>} */
    this.jobs = new Map();
  }

  /**
   * Bir görevi tekrarlı çalıştır.
   * @param {string} jobId - Benzersiz kimlik
   * @param {Function} task - Çalıştırılacak fonksiyon (async olabilir)
   * @param {{
   *   everySeconds: number,     // zorunlu: kaç saniyede bir çalışsın
   *   forSeconds?: number,      // opsiyonel: toplam çalışma süresi (bittiğinde otomatik durur)
   *   maxRuns?: number,         // opsiyonel: en fazla kaç kez çalışsın
   *   startDelaySeconds?: number, // opsiyonel: başlamadan önce kaç sn beklesin
   *   meta?: any                // opsiyonel: senin saklamak istediğin ek bilgiler
   * }} opts
   */
  start(jobId, task, opts) {
    const {
      everySeconds,
      forSeconds,
      maxRuns,
      startDelaySeconds = 0,
      meta = undefined,
    } = opts || {};

    if (!everySeconds || everySeconds <= 0) {
      throw new Error('everySeconds > 0 olmalı');
    }
    if (this.jobs.has(jobId)) {
      throw new Error(`Bu jobId zaten var: ${jobId}`);
    }

    const state = { runs: 0, meta };
    this.jobs.set(jobId, state);

    const begin = () => {
      const tick = async () => {
        state.runs += 1;
        try {
          await Promise.resolve(task());
        } catch (e) {
          // Task hata verirse logla ama interval’i öldürme (istersen burada iptal de edebilirsin)
          console.error(`Interval job '${jobId}' task error:`, e);
        }

        if (typeof maxRuns === 'number' && state.runs >= maxRuns) {
          this.cancel(jobId);
        }
      };

      // İlk tick hemen mi, interval sonunda mı?
      // İstersen ilk tick’i hemen çalıştır:
      tick();

      state.interval = setInterval(tick, everySeconds * 1000);
    };

    if (startDelaySeconds > 0) {
      setTimeout(begin, startDelaySeconds * 1000);
    } else {
      begin();
    }

    if (forSeconds && forSeconds > 0) {
      state.stopper = setTimeout(() => this.cancel(jobId), forSeconds * 1000);
    }

    return { jobId, everySeconds, forSeconds, maxRuns, startDelaySeconds };
  }

  /** Job’ı durdur ve belleği temizle */
  cancel(jobId) {
    const state = this.jobs.get(jobId);
    if (!state) return false;
    if (state.interval) clearInterval(state.interval);
    if (state.stopper) clearTimeout(state.stopper);
    this.jobs.delete(jobId);
    return true;
  }

  /** Çalışan job’ları listele (id + meta + runs) */
  list() {
    return Array.from(this.jobs.entries()).map(([id, s]) => ({
      jobId: id,
      runs: s.runs,
      meta: s.meta,
    }));
  }
}

module.exports = new IntervalScheduler();
