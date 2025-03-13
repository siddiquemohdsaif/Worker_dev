const { Worker } = require('worker_threads');
const http = require('http');

const clanMatchMakingWorker = new Worker('./clanMatchMaking/clanMatchMakingWorker.js');
const clanWarResultMakerWorker = new Worker('./clanWarResultMaker/clanWarResultMakerWorker.js');
const leaderBoardEvaluatorWorker = new Worker('./LeaderBoardEvaluator/leaderBoardEvaluatorWorker.js');
const seasonManagerWorker = new Worker('./SeasonAndEvent/seasonAndEventManager.js');




// Listen for messages from the worker
clanMatchMakingWorker.on('message', (msg) => {
    console.log('Master received from clanMatchMakingWorker:', msg);
});

// Listen for messages from the worker
clanWarResultMakerWorker.on('message', (msg) => {
    console.log('Master received from clanWarResultMakerWorker:', msg);
});

// Listen for messages from the worker
leaderBoardEvaluatorWorker.on('message', (msg) => {
    console.log('Master received from leaderBoardEvaluatorWorker:', msg);
});


// Listen for messages from the worker
seasonManagerWorker.on('message', (msg) => {
    console.log('Master received from seasonManagerWorker:', msg);
});




// Function to check if all workers are running
function areAllWorkersRunning() {
    return clanMatchMakingWorker.threadId !== null &&
           clanWarResultMakerWorker.threadId !== null &&
           leaderBoardEvaluatorWorker.threadId !== null&&
           seasonManagerWorker.threadId !== null;
}

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/is-all-worker-running' && req.method === 'GET') {
        const allRunning = areAllWorkersRunning();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(allRunning.toString());
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(15996, () => {
    console.log('Server running on port 15996');
});
