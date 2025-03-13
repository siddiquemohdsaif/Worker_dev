const PlayerLeaderboardHandler = require("../LeaderBoardEvaluator/Utils/PlayerLeaderboardHandler");

const ClanLeaderboardHandler = require("../LeaderBoardEvaluator/Utils/ClanLeaderboardHandler");

const FirestoreManager = require("../Firestore/FirestoreManager");
const firestore = FirestoreManager.getInstance();

const test = async() => {
    //await PlayerLeaderboardHandler.startUpdating()
    //await ClanLeaderboardHandler.startUpdating();
        
    const GameInfo_docs = await firestore.readCollectionDocuments("GameInfo", "/");

    for(let i=0; i<GameInfo_docs.length; i++){
        if(GameInfo_docs[i].staticCacheInvalidate){
            console.log(GameInfo_docs[i]._id);
            await firestore.updateDocument("GameInfo", GameInfo_docs[i]._id ,"/", {staticCacheInvalidate : Date.now()})
        }
    }

}

test();

