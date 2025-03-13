const EventCache = require("./Event");
const LZ4_util = require('../../Utils/LZ4_util');
const axios = require('axios');
const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();




const getEventTopPlayers = async (eventId) => {
    try {
        const response = await axios.post(`https://function.cloudsw3.com/cc-app-api/InternalServerAPIs/eventData?eventId=${eventId}`);
        return response.data;
    } catch (error) {
        console.error('Error calling getEventTopPlayers API:', error);
        throw new Error("error :" + error.message);
    }
}

const createEvent = async (eventId, eventType) => {
    try {
        const response = await axios.post(`https://function.cloudsw3.com/cc-app-api/InternalServerAPIs/eventCreate?eventId=${eventId}&eventType=${eventType}`);
        return response.data;
    } catch (error) {
        console.error('Error calling createEvent API:', error);
        throw new Error("error :" + error.message);
    }
}


const deleteEvent = async (eventId) => {
    try {
        const response = await axios.post(`https://function.cloudsw3.com/cc-app-api/InternalServerAPIs/eventDelete?eventId=${eventId}`);
        return response.data;
    } catch (error) {
        console.error('Error calling createEvent API:', error);
        throw new Error("error :" + error.message);
    }
}

function generateRandomString_Aa0(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}


const proccess = async (Events) => {

    try{



        const now = Date.now();

        // event initialize
        for (const event of Events) {
            if(event.type === "COIN_COLLECT" && !event._initialize){

                //create event data collection
                await createEvent(event.id, event.type);
                event._initialize = true;

                //updateEvent
                await firestoreManager.updateDocument("Data", "Event", "/", {EventInfo : Events});

                return true;

            }else{

                //Implemented for other event!

            }
        }




        // event finish
        for (const event of Events) {

            if(event.type === "COIN_COLLECT" && now > event.endTime && event._initialize &&!event._isFinish){

                //get Result
                const response = await getEventTopPlayers(event.id);
                const playersStr = response.substring(2, response.length);
                
                //decompress and parse
                const players = JSON.parse(await LZ4_util.decompressString(playersStr));
                console.log(players);


                //prepare Reward object
                let rewards = {};
                for (let i = 0; i < players.length; i++) {
                    const playerRank = i + 1;
                
                    // Determine the reward for the current rank
                    for (const key in event.reward) {
                        const rewardEntry = event.reward[key];
                        const range = rewardEntry.rewardedTo.split('-');
                        const minRank = parseInt(range[0], 10);
                        const maxRank = range.length > 1 ? parseInt(range[1], 10) : minRank;
                
                        if (playerRank >= minRank && playerRank <= maxRank) {
                            let rewardTypesList = rewardEntry.rewardType.split('|');
                            let rewardValuesList = rewardEntry.reward.split('|');
                            let rewardTypes = rewardTypesList[0];
                            let rewardValues = rewardValuesList[0];

                            if (rewardTypes[0] === "CARROM_PASS"){ // if already have carromPass give gems
                                if(players[i].gameData.carromPass.isPremiumMember){
                                    rewardTypes = rewardTypesList[1];
                                    rewardValues = rewardValuesList[1];
                                }
                            }
                
                            rewards[players[i].uid] = {
                                rewardType: rewardTypes,
                                reward: rewardValues
                            };
                            break;
                        }
                    }
                }

                
                //save to ResultAndReward via unique Id
                let resultKey = generateRandomString_Aa0(18);
                let resultAndReward = {playersData : playersStr, rewards, resultKey};
                await firestoreManager.createDocument("ResultAndReward", resultKey, "Data/Event", resultAndReward);
                event.pastResult = resultKey;
                console.log(resultAndReward);


                //delete event collection
                await deleteEvent(event.id);


                //restart event if autoStart enable
                if(event.autoRestart){
                    event._initialize = false;
                    event.endTime = Date.now() + (event.endTime - event.startTime);
                    event.startTime = Date.now();

                }else{
                    event._isFinish = true;
                }

                //updateEvent
                await firestoreManager.updateDocument("Data", "Event", "/", {EventInfo : Events});

                return true;

            }else{

                //Implemented for other event!

            }

        }

    }catch(error){
        console.error(error);
    }

    return false;

}


module.exports = {
    proccess
}







// async function test() {
//     try {

//         // Load event stack
//         const Event = await EventCache.get();
//         await proccess(Event.EventInfo);
//     } catch (error) {
//         console.error('Error in startEventManagerWorker:', error);
//     }
// }


// test();