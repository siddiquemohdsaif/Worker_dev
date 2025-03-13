
const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestore = FirestoreManager.getInstance();

const gameInfoDocList = ["StrikerInfo","PowerInfo","PuckInfo","AvatarInfo","FrameInfo","EmojiInfo","MapSliderInfo","BackendServerInfo"];
const dataDocList = ["CarromPass","Chest","Shop","League","Event"];
let gameInfo_previous = "";
let data_previous = "";
let lastCheck = Date.now();

// read all cache doc [duration 10 sec]


// check is any thing change

// if no => return 

// if yes => update App config and also update comparator



const checkCacheChange = async() => {
    
    const GameInfo_docs = await firestore.bulkReadDocuments("GameInfo", "/", gameInfoDocList, {});
    const gameInfo = JSON.stringify(GameInfo_docs);

    const Data_docs = await firestore.bulkReadDocuments("Data", "/", dataDocList, {});
    const data = JSON.stringify(Data_docs);

    if(gameInfo_previous !== gameInfo || data_previous !== data){
        // cache changed
        gameInfo_previous = gameInfo;
        data_previous = data;
        return true;
    }else {
        return false;
    }
}


const updateConfig = async() => {
    
    const GameInfo_docs = await firestore.readCollectionDocuments("GameInfo", "/");
    for(let i=0; i<GameInfo_docs.length; i++){
        if(GameInfo_docs[i].staticCacheInvalidate){
            await firestore.updateDocument("GameInfo", GameInfo_docs[i]._id ,"/", {staticCacheInvalidate : Date.now()})
        }
    }

}



const syncConfing = async() => {

    if(lastCheck + 10000 > Date.now()){
        return; // 10 second perid for check
    }

    const isCacheChange = await checkCacheChange();

    if(isCacheChange){
        await updateConfig();
        console.log("cache purged of staticDocuments!");
    }
}


module.exports = {
    syncConfing,
}



























