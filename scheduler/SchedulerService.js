// app.js
const { Scheduler } = require('./Scheduler');

const scheduler = new Scheduler();

// 1 saatte bir (varsayılan)
scheduler.addJob({
  name: 'cleanTemp',
  every: '1h',
  jitterMs: 10_000,
  fn: async () => { /* fs temizliği */ }
});

// 2 saatte bir, başlar başlamaz çalışsın
scheduler.addJob({
  name: 'syncLeaderboard',
  every: '2h',
  runAtStart: true,
  fn: async () => { /* skor senkronizasyonu */ }
});

// 15 dakikada bir, 5 sn'den uzun sürerse uyar
scheduler.addJob({
  name: 'sendReminders',
  every: '1m',
  timeoutMs: 5_000,
  fn: async () => { 
    console.log("Reminder sent at", new Date().toISOString());
   }
});



// İstediğin zaman manuel tetikleyebilirsin:
// await scheduler.runNow('sendReminders');

// Graceful shutdown
process.on('SIGINT', () => { scheduler.stop(); process.exit(0); });
process.on('SIGTERM', () => { scheduler.stop(); process.exit(0); });

exports.schedulerService = { scheduler };