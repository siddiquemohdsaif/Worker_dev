const { parentPort, workerData } = require('worker_threads');
const { initServer } = require('./leaderboardSever');

// Initialize the server
initServer();

