const { parentPort } = require('worker_threads');
const axios = require('axios');
const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();


let matchmakingIntervalInSeconds = 3600; // Default is 1 hour
// let matchmakingIntervalInSeconds = 600; // for test is 10 min
let timer;

const matchmaking = async (matchMakingId, warStartTime) => {
    //console.log('Matching clans...' + matchMakingId);

    const collection = 'MatchMaking';
    const docName = matchMakingId;
    const parentPath = '/ClanWar/BeforeWar';

    const docClansWar = await firestoreManager.readDocument(collection, docName, parentPath);
    const clansWarList = [];
    let leftClan;

    // 1. Remove _id and info
    delete docClansWar._id;
    delete docClansWar.info;

    // 2. Check for odd number of clans and remove the latest clan if necessary
    const clanKeys = Object.keys(docClansWar);
    if (clanKeys.length % 2 !== 0) {
        // Find the latest clan using timestamps
        const latestKey = clanKeys.reduce((latest, current) => {
            const currentTimeStamp = current.substring(0, current.length - 9);
            const latestTimeStamp = latest.substring(0, latest.length - 9);
            return (currentTimeStamp > latestTimeStamp) ? current : latest;
        });

        leftClan = {
            key: latestKey,
            ...docClansWar[latestKey]
        };
        delete docClansWar[latestKey];
    }

    // 3. Construct clansWarList
    for (const key in docClansWar) {
        clansWarList.push({
            key: key,
            ...docClansWar[key]
        });
    }

    if(clansWarList.length < 2){
        return;
    }

    //make match
    await makeMatch(clansWarList, warStartTime);

    //delete all clansWarList clan fom docClansWar
    console.time("deleteTimer");
    await deleteClansFromFirestore(collection, parentPath, docName, clansWarList);
    console.timeEnd("deleteTimer");
    //console.log("end delete deleted :" + clansWarList.length);
};


const makeMatch = async (clansWarList, warStartTime) => {

    const data = {
        clansWarList,
        warStartTime
    };

    // Make the API call
    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/clanWarServer/makeMatch', data);
        // Handle response here
        //console.log(response.data);
    } catch (error) {
        console.error('Error calling makeMatch API:', error);
        throw new Error("error :" + error.message);
    }

}


const deleteClansFromFirestore = async (collection, parentPath, docName, clans) => {
    for (const clan of clans) {
        try {
            await firestoreManager.deleteField(collection, parentPath, docName, clan.key);
            //console.log(`Successfully deleted clan ${clan.key} from ${docName}`);
        } catch (error) {
            //console.error(`Failed to delete clan ${clan.key} from ${docName}: ${error.message}`);
        }
    }
};


const performAllMatchmaking = async () => {
    const matchmakingTypes = [
        'ClanMatchMaking-3',
        'ClanMatchMaking-5',
        'ClanMatchMaking-10',
        'ClanMatchMaking-20',
        'ClanMatchMaking-40'
    ];


    const warStartTime = Date.now() + (12 * 3600 * 1000); // 12 hour later
    //const warStartTime = Date.now() + ( 600 * 1000); // for test 10 min later

    for (const type of matchmakingTypes) {
        try {
            await matchmaking(type, warStartTime);
        } catch (e) {
            console.log(`Error in ${type}:`, e);
        }
    }
};

const startMatchmaking = async (intervalInSeconds) => {
    const intervalInMilliseconds = intervalInSeconds * 1000;

    await performAllMatchmaking();

    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(performAllMatchmaking, intervalInMilliseconds);
};

// Listen for messages from the master
parentPort.on('message', (msg) => {
    if (msg.type === 'SET_INTERVAL') {
        matchmakingIntervalInSeconds = msg.intervalInSeconds;
        startMatchmaking(matchmakingIntervalInSeconds);
    }
});

// Start matchmaking with the default interval
startMatchmaking(matchmakingIntervalInSeconds);
