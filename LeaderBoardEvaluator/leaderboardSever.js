const http = require('http');
const url = require('url');
const playerLeaderBoard = require('./Utils/PlayerLeaderboardHandler.js');
const clanLeaderBoard = require('./Utils/ClanLeaderboardHandler.js');
const LZ4_util = require('../Utils/LZ4_util.js');


playerLeaderBoard.startUpdating(); // Begin periodic updates
clanLeaderBoard.startUpdating(); // Begin periodic updates

// Cache objects to store serialized responses
const playerCache = {
    response: null,
    timestamp: 0,
    from: null,
    to: null
};

const clanCache = {
    response: null,
    timestamp: 0,
    from: null,
    to: null
};

const initServer = async () => {
    const server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url, true);

        if (parsedUrl.pathname === '/get-top-players' && req.method === 'GET') {
            let from = parseInt(parsedUrl.query.from);
            let to = parseInt(parsedUrl.query.to);
            let uid = parsedUrl.query.uid;
            let isFresh = parsedUrl.query.isFresh === 'true'; //optional, defaults to false

            // Validation and conversion of query params
            from = Math.min(Math.max(from, 1), 999) - 1;  // subtracting 1 to make it zero-based
            to = Math.min(Math.max(to, 2), 1000);

            // Check if we should use cached data
            const now = Date.now();
            if (!isFresh && playerCache.response && now - playerCache.timestamp < 10000 && playerCache.from === from && playerCache.to === to) {
                const myPosition = playerLeaderBoard.getPlayersPosition(uid);

                // Formulate the response string
                // console.log("2 ,topPlayers",playerCache.response);
                const responseString = myPosition + "," + playerCache.response;
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(responseString);
            } else {
                const topPlayers = isFresh ? await playerLeaderBoard.getTopPlayersFresh(from, to) : playerLeaderBoard.getTopPlayers(from, to);
                const myPosition = playerLeaderBoard.getPlayersPosition(uid);

                // Formulate the response string
                // console.log("2 ,topPlayers",topPlayers);
                const topPlayersString = await LZ4_util.compressString(JSON.stringify(topPlayers));
                const responseString = myPosition + "," + topPlayersString;

                // Cache the response string
                playerCache.response = topPlayersString;
                playerCache.timestamp = now;
                playerCache.from = from;
                playerCache.to = to;

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(responseString);
            }

        } else if (parsedUrl.pathname === '/get-top-clans' && req.method === 'GET') {
            let from = parseInt(parsedUrl.query.from);
            let to = parseInt(parsedUrl.query.to);
            let cid = parsedUrl.query.cid;
            let isFresh = parsedUrl.query.isFresh === 'true'; //optional, defaults to false

            // Validation and conversion of query params
            from = Math.min(Math.max(from, 1), 999) - 1;  // subtracting 1 to make it zero-based
            to = Math.min(Math.max(to, 2), 1000);

            const now = Date.now();
            if (!isFresh && clanCache.response && now - clanCache.timestamp < 10000 && clanCache.from === from && clanCache.to === to) {
                const myPosition = clanLeaderBoard.getClanPosition(cid);

                // Formulate the response string
                const responseString = myPosition + "," + clanCache.response;
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(responseString);
            } else {
                const topClans = isFresh ? await clanLeaderBoard.getTopClansFresh(from, to) : clanLeaderBoard.getTopClans(from, to);
                const myPosition = clanLeaderBoard.getClanPosition(cid);

                // Formulate the response string
                const topClansString = await LZ4_util.compressString(JSON.stringify(topClans));
                const responseString = myPosition + "," + topClansString;

                // Cache the response string
                clanCache.response = topClansString;
                clanCache.timestamp = now;
                clanCache.from = from;
                clanCache.to = to;

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(responseString);
            }

        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    const PORT = 15997+100;
    server.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
};

module.exports = {
    initServer
};
