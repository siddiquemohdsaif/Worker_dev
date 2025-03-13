const FirestoreManager = require('../../Firestore/FirestoreManager');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');

class PlayerLeaderboardHandler {
    constructor() {
        this.playersTop = [];
        this.playersPositionMap = new Map();
    }

    async fetchAllPlayerProfiles(playersLimit) {
        const collName = 'Users';
        const parentPath = '/';
        const projection = { "gameData.trophy": 1, "uid": 1 };
        const pageSize = 9999;
        let lastDocId = null;
        let players = [];
        // let allDocs = []; // To store all raw documents
        let hasMore = true;
    
        while (hasMore) {
            const { docs, lastDocId: newLastDocId } = await FirestoreManager.getInstance().readCollectionDocumentsWithPaging(
                collName,
                parentPath,
                lastDocId,
                pageSize,
                projection
            );
    
            // Add the raw documents to the allDocs array
            // allDocs = allDocs.concat(docs);
    
            const newPlayers = docs.map(profile => ({
                uid: profile.uid,
                trophy: profile.gameData.trophy
            }));
    
            // Sort new players by trophy in descending order
            newPlayers.sort((a, b) => b.trophy - a.trophy);
    
            // Merge the sorted new players into the already sorted players array
            players = this.mergeSortedArrays(players, newPlayers);
    
            // Keep only the top players based on the specified limit
            if (players.length > playersLimit) {
                players = players.slice(0, playersLimit);
            }
    
            lastDocId = newLastDocId;
            hasMore = docs.length === pageSize;
        }
    
        // // Save both players and docs to a JSON file
        // const filePath1 = '/tmp/players.json';
        // const filePath2 = '/tmp/docs.json';
        // const playersToSave = {
        //     players: players,
        // };
        // const rawDocsToSave = {
        //     rawDocs: allDocs,
        // };
    
        // try {
        //     fs.writeFileSync(filePath1, JSON.stringify(playersToSave, null, 2), 'utf8');
        //     fs.writeFileSync(filePath2, JSON.stringify(rawDocsToSave, null, 2), 'utf8');
        //     console.log(`Players and documents saved successfully to ${filePath1} and ${filePath2}`);
        // } catch (error) {
        //     console.error(`Error saving players and documents to file: ${error.message}`);
        // }
    
        return players;
    }
    
    // Helper function to merge two sorted arrays
    mergeSortedArrays(arr1, arr2) {
        let merged = [];
        let i = 0, j = 0;
    
        while (i < arr1.length && j < arr2.length) {
            if (arr1[i].trophy > arr2[j].trophy) {
                merged.push(arr1[i++]);
            } else {
                merged.push(arr2[j++]);
            }
        }
    
        while (i < arr1.length) {
            merged.push(arr1[i++]);
        }
    
        while (j < arr2.length) {
            merged.push(arr2[j++]);
        }
    
        return merged;
    }
    

    async fetchTopPlayers(uids) {
        const maxBatchSize = 3000; // Reduced batch size for Firestore limits
        const topUids = uids.slice(0, 20000);
        const collName = 'Users';
        const parentPath = '/';
        const projection = {
            "gameData": {
                "xp": 1,
                "trophy": 1,
                "collection": 1,
                "carromPass": { "isPremiumMember": 1 }
            },
            "profileData": 1,
            "uid": 1
        };
    
        let players = [];
    
        // Process players in batches
        for (let i = 0; i < topUids.length; i += maxBatchSize) {
            const batchUids = topUids.slice(i, i + maxBatchSize);
            // console.log(`Fetching batch ${i / maxBatchSize + 1}, batch size: ${batchUids.length}`);
            const players_chunk = await FirestoreManager.getInstance().bulkReadDocuments(collName, parentPath, batchUids, projection);
            players = players.concat(players_chunk);
        }
    
        // Extract and deduplicate clanIds
        const clanIds = [...new Set(players.map(player => player.profileData.clanId).filter(clanId => clanId !== "null"))];
    
        if (clanIds.length === 0) {
            // Map default clan details to players
            players = players.map(player => ({
                ...player,
                clanName: "No clan",
                clanLogo: 0
            }));
        } else {
            // Fetch clan details in bulk
            const clansCollName = 'Clans';
            const clanBatches = [];
            for (let i = 0; i < clanIds.length; i += maxBatchSize) {
                const batchClanIds = clanIds.slice(i, i + maxBatchSize);
                // console.log(`Fetching clan batch ${i / maxBatchSize + 1}, batch size: ${batchClanIds.length}`);
                clanBatches.push(this.bulkReadClans(clansCollName, parentPath, batchClanIds));
            }
            const clanResults = await Promise.all(clanBatches);
            const clans = Object.assign({}, ...clanResults); // Combine all clan results
    
            // Map clan details to players
            players = players.map(player => {
                const clanId = player.profileData.clanId;
                if (clanId !== "null" && clans[clanId]) {
                    player.clanName = clans[clanId].clanName;
                    player.clanLogo = clans[clanId].clanLogo;
                } else {
                    player.clanName = "No clan";
                    player.clanLogo = 0;
                }
                return player;
            });
    
        }
    
        // console.log(`Total players processed: ${players.length}`);
        return players;
    }
    

    async bulkReadClans(collName, parentPath, clanIds) {
        const chunkSize = 3000; // Size of each chunk
        const projection = { "clanName": 1, "clanLogo": 1 };
        let allClans = {};
    
        for (let i = 0; i < clanIds.length; i += chunkSize) {
            const chunkClanIds = clanIds.slice(i, i + chunkSize);
            const chunkClansData = await FirestoreManager.getInstance().bulkReadDocumentsInMap(collName, parentPath, chunkClanIds, projection);
            // Merge the chunk's clan data into the allClans map
            allClans = {...allClans, ...chunkClansData};
        }
    
        return allClans;
    }

    

    async updateTopPlayersOnly() {
        const uids = this.playersTop.map(player => player.uid);
        this.playersTop = await this.fetchTopPlayers(uids);
        // console.log("updateTopPlayersOnly: playersTop",playersTop)
        this.playersTop.sort((a, b) => b.gameData.trophy - a.gameData.trophy);
        this.updatePlayersPositionMap();
        //console.log(this.playersTop);
    }

    async totalUpdate() {
        const players = await this.fetchAllPlayerProfiles(20000);
        this.playersTop = await this.fetchTopPlayers(players.map(player => player.uid));
        this.updatePlayersPositionMap();
        //console.log(players);
        //console.log('Total update done.');
    }

    updatePlayersPositionMap() {
        this.playersPositionMap.clear();
        this.playersTop.forEach((player, index) => {
            this.playersPositionMap.set(player.uid, index + 1);
        });
        // console.log("updatePlayersPositionMap: playersPositionMap",this.playersPositionMap)
    }

    getTopPlayers(from, to) {
        return this.playersTop.slice(from, to);
    }

    async getTopPlayersFresh(from, to) {
        await this.updateTopPlayersOnly();
        return this.playersTop.slice(from, to);
    }

    getPlayersPosition(uid) {
        return this.playersPositionMap.get(uid) || 0;
    }
    
    async startUpdating() {
        try{
            await this.totalUpdate(); // Initial total update

            // Update playersTop every 5 minutes
            setInterval(() => this.updateTopPlayersOnly(), 5 * 60 * 1000);

            // Schedule total updates at fixed times
            const times = ['0 30 19 * * *', '0 30 0 * * *', '0 30 6 * * *', '0 30 12 * * *']; // => india  ['0 0 1 * * *', '0 0 6 * * *', '0 0 12 * * *', '0 0 18 * * *'];
            times.forEach(time => {
                schedule.scheduleJob(time, async () => {
                    try {
                        await this.totalUpdate();
                    } catch (e) {
                        console.error(e);
                    }
                });
            });
        }catch(e){
            console.error(e);
        }
    }
}

module.exports = new PlayerLeaderboardHandler();  // Exporting the singleton instance
