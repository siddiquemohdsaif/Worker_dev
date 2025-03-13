const DBdirectConnect = require("./DBdirectConnect");
const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const PastResultMaker = require("./PastResultMaker");
const PostTask = require("./PostTask");
const AppConfigCacheSync = require("./AppConfigCacheSync");



const resetUserTrophy = async() => {
    const db = await DBdirectConnect.getDb("userTrophyNormalization");
    return await DBdirectConnect.resetUserTrophy(db);
}

const resetClanTrophy = async() => {
    const db = await DBdirectConnect.getDb("clanTrophyNormalization");
    return await DBdirectConnect.resetClanTrophy(db);
}


const resetUnlockData = async() => {
    const db = await DBdirectConnect.getDb("userUnlockCardInvalidate");
    return await DBdirectConnect.resetUnlockData(db);
}

const isDbOk = async() => {
    const db = await DBdirectConnect.getDb("userTrophyNormalization");
    return true;
}


const replaceSeason = async (Season) => {
    try {
        const {
            CarromPass,
            StrikerInfo,
            PowerInfo,
            PuckInfo,
            TrailsInfo,
            AvatarInfo,
            FrameInfo,
            EmojiInfo
        } = Season;

        // Remove _id fields
        delete CarromPass._id;
        delete StrikerInfo._id;
        delete PowerInfo._id;
        delete PuckInfo._id;
        delete TrailsInfo._id;
        delete AvatarInfo._id;
        delete FrameInfo._id;
        delete EmojiInfo._id;

        // Reset CarromPass
        const carromPassChangeResult = await firestoreManager.createDocument("Data", "CarromPass", "/", CarromPass);

        // Reset StrikerInfo
        const strikerInfoChangeResult = await firestoreManager.createDocument("GameInfo", "StrikerInfo", "/", StrikerInfo);

        // Reset PowerInfo
        const powerInfoChangeResult = await firestoreManager.createDocument("GameInfo", "PowerInfo", "/", PowerInfo);

        // Reset PuckInfo
        const puckInfoChangeResult = await firestoreManager.createDocument("GameInfo", "PuckInfo", "/", PuckInfo);

        // Reset TrailsInfo
        const trailsInfoChangeResult = await firestoreManager.createDocument("GameInfo", "TrailsInfo", "/", TrailsInfo);

        // Reset AvatarInfo
        const avatarInfoChangeResult = await firestoreManager.createDocument("GameInfo", "AvatarInfo", "/", AvatarInfo);

        // Reset FrameInfo
        const frameInfoChangeResult = await firestoreManager.createDocument("GameInfo", "FrameInfo", "/", FrameInfo);

        // Reset EmojiInfo
        const emojiInfoChangeResult = await firestoreManager.createDocument("GameInfo", "EmojiInfo", "/", EmojiInfo);

        return {
            carromPassChangeResult,
            strikerInfoChangeResult,
            powerInfoChangeResult,
            puckInfoChangeResult,
            trailsInfoChangeResult,
            avatarInfoChangeResult,
            frameInfoChangeResult,
            emojiInfoChangeResult
        };
    } catch (error) {
        console.error("Error replacing season data:", error);
        throw new Error("Failed to replace season data.");
    }
};


const removeSeasonFromStack = async(id) => {
    return await firestoreManager.deleteField("Data", "/", "SeasonStack", id);
}

const purgeFirestoreCache = async () => {
    await firestoreManager.purgeAllCache();
}


const changeSeason = async(id, Season) => {

    //console.log("Changing season to :");
    const SeasonObj = JSON.parse(Season);

    // check is db ok
    const isOk = await isDbOk()
    if(!isOk){
        throw new Error("unable to connect to db!");
    }

    //console.log(Season);


    //create result of leaderboard
    await PastResultMaker.makeResult();


    //change trophy of users and clans and aslo user unlock data 
    await resetUserTrophy();
    await resetClanTrophy();
    await resetUnlockData();


    //firestore cache purge
    await purgeFirestoreCache();


    //replace season
    await replaceSeason(SeasonObj);


    //remove this from stack
    await removeSeasonFromStack(id);

    console.log("Season changed Successfully...!");
}


const doPostTask = async() => {

    //console.log("Post season task started:");

    //LeaderBoard refresh
    await PostTask.refreshLeaderBoard();

    //app static update
    await AppConfigCacheSync.syncConfing();

    //season change broadcast (pugre cache and reload new static doc and load profile and gameData)
    await PostTask.bakboneBroadcastSeasonChange();

    //console.log("Post season task end");
}




module.exports = {
    changeSeason,
    doPostTask
}




