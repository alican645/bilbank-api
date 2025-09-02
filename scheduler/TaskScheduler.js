// services/TaskScheduler.js
const schedule = require('node-schedule');

class TaskScheduler {
  constructor() {
    this.jobs = new Map(); // jobId -> job
  }

  /**
   * Belirli bir zamanda bir fonksiyon çalıştır
   * @param {string} jobId - Job kimliği
   * @param {Date} date - Çalışma zamanı
   * @param {Function} task - Çalıştırılacak fonksiyon
   */
  scheduleJob(jobId, date, task) {
    if (this.jobs.has(jobId)) {
      throw new Error(`Job already exists with id: ${jobId}`);
    }
    const job = schedule.scheduleJob(date, task);
    this.jobs.set(jobId, job);
    console.log(`📅 Job scheduled with id ${jobId} at ${date}`);
    return job;
  }

  /**
   * Job iptal et
   * @param {string} jobId
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.cancel();
      this.jobs.delete(jobId);
      console.log(`❌ Job cancelled with id ${jobId}`);
    }
  }

  /**
   * Çalışan tüm jobları listele
   */
  listJobs() {
    return Array.from(this.jobs.keys());
  }
}

module.exports = new TaskScheduler();
