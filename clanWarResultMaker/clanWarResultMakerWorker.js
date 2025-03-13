const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global variable to hold ongoing wars
let onGoingWar = [];

async function loadOngoingWars() {
    const docIds = await firestoreManager.readCollectionDocumentIds('OnGoingWar', '/ClanWar/War');
    const chunks = chunkArray(docIds, 1000);

    for (let chunk of chunks) {
        const docs = await firestoreManager.bulkReadDocuments('OnGoingWar', '/ClanWar/War', chunk, {warEndTime: 1, warId: 1, clanId1 : 1, clanId2 : 1});
        onGoingWar = onGoingWar.concat(docs);
    }

    onGoingWar.sort((a, b) => a.warEndTime - b.warEndTime);
}

async function processEndedWars() {
    const currentTime = Date.now();
    let endedWars = [];
    let updatedOnGoingWar = [];

    // Check the first war's endTime. If it's greater than currentTime, just return.
    if (onGoingWar[0] && onGoingWar[0].warEndTime > currentTime) {
        return;
    }

    for (let war of onGoingWar) {
        if (war.warEndTime <= currentTime) {
            endedWars.push(war);
        } else {
            updatedOnGoingWar.push(war);
        }
    }

    if (endedWars.length > 0) {
        await makeResult(endedWars)
    }

    onGoingWar = updatedOnGoingWar;
}


const makeResult = async (warDoc) => {
    const data = { warDoc };

    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/clanWarServer/makeResult', data);
        //console.log(response.data);
    } catch (error) {
        console.error('Error calling makeResult API:', error);
        throw new Error("error :" + error.message);
    }
}


function chunkArray(array, size) {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunked_arr.push(chunk);
    }
    return chunked_arr;
}

async function startWarResultMakerWorker() {
    await loadOngoingWars();

    const interval = setInterval(async () => {
        try{
            await processEndedWars();
        }catch (e) {
            console.error(e);
        }
        

        if (onGoingWar.length === 0) {
            clearInterval(interval); 
            startWarResultMakerWorker(); 
        }
    }, 2000);
}

startWarResultMakerWorker();
