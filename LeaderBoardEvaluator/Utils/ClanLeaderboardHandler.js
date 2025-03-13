const FirestoreManager = require('../../Firestore/FirestoreManager');
const schedule = require('node-schedule');

class ClanLeaderboardHandler {
    constructor() {
        this.clansTop = [];
        this.clansPositionMap = new Map();
    }

    async fetchAllClanProfiles(clansLimit) {
        const collName = 'Clans';
        const parentPath = '/';
        const projection = { "clanTrophy": 1, "clanId": 1 };
        const pageSize = 10000;
        let lastDocId = null;
        let clans = [];
        let hasMore = true;

        while (hasMore) {
            const { docs, lastDocId: newLastDocId } = await FirestoreManager.getInstance().readCollectionDocumentsWithPaging(
                collName,
                parentPath,
                lastDocId,
                pageSize,
                projection
            );

            const newClans = docs.map(profile => ({
                clanId: profile.clanId,
                clanTrophy: profile.clanTrophy
            }));

            newClans.sort((a, b) => b.clanTrophy - a.clanTrophy);

            clans = this.mergeSortedArrays(clans, newClans);

            if (clans.length > clansLimit) {
                clans = clans.slice(0, clansLimit);
            }

            lastDocId = newLastDocId;
            hasMore = docs.length === pageSize;
        }

        return clans;
    }

    mergeSortedArrays(arr1, arr2) {
        let merged = [];
        let i = 0, j = 0;

        while (i < arr1.length && j < arr2.length) {
            if (arr1[i].clanTrophy > arr2[j].clanTrophy) {
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

    async fetchTopClans(clanIds) {
        const maxBatchSize = 3500;  // Define a suitable batch size, adjust if necessary
        const topClanIds = clanIds.slice(0, 10000);
        const collName = 'Clans';
        const parentPath = '/';
        const projection = {"warHistory" : 0};
    
        let allClans = [];
    
        for (let i = 0; i < topClanIds.length; i += maxBatchSize) {
            const batchClanIds = topClanIds.slice(i, i + maxBatchSize);
            const clans = await FirestoreManager.getInstance().bulkReadDocuments(collName, parentPath, batchClanIds, projection);
            allClans = allClans.concat(clans);
        }
        
        // Filter out clans with zero members
        const clansWithMembers = allClans.filter(clan => clan.members && clan.members.length > 0);
    
        return clansWithMembers;
    }

    async updateTopClansOnly() {
        const clanIds = this.clansTop.map(clan => clan.clanId);
        if(clanIds.length === 0){
            return;
        }
        this.clansTop = await this.fetchTopClans(clanIds);
        this.clansTop.sort((a, b) => b.clanTrophy - a.clanTrophy);
        this.updateClansPositionMap();
        //console.log(this.clansTop);
    }

    async totalUpdate() {
        const clans = await this.fetchAllClanProfiles(20000);
        if(clans.length === 0){
            this.clansTop = [];
            return;
        }        
        this.clansTop = await this.fetchTopClans(clans.map(clan => clan.clanId));
        this.updateClansPositionMap();
        //console.log(this.clansTop);
        //console.log('Total update done.');
    }

    updateClansPositionMap() {
        this.clansPositionMap.clear();
        this.clansTop.forEach((clan, index) => {
            this.clansPositionMap.set(clan.clanId, index + 1);
        });
    }

    getTopClans(from, to) {
        return this.clansTop.slice(from, to);
    }

    async getTopClansFresh(from, to) {
        await this.updateTopClansOnly();
        return this.clansTop.slice(from, to);
    }

    getClanPosition(clanId) {
        return this.clansPositionMap.get(clanId) || 0;
    } 

    async startUpdating() {
        try{
            await this.totalUpdate(); // Initial total update

            // Update clansTop every 5 minutes
            setInterval(() => this.updateTopClansOnly(), 5 * 60 * 1000);

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

module.exports = new ClanLeaderboardHandler();  // Exporting the singleton instance

