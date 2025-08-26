// /utils/clock.js
const nowMs = () => Date.now();
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
module.exports = { nowMs, delay };
