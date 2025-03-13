const { MongoClient } = require('mongodb');
const PreviousSeasonItems = require('./PreviousSeasonItems');

const getDb = async(purpose) => {
    const uri = 'mongodb://128.199.227.113:23115/';  //error : if pm2 node change
    const client = new MongoClient(uri);
    await client.connect();

    let dbName;
    if(purpose === "userTrophyNormalization"){
        dbName = 'carrom-clash-9t32';

    }else if(purpose === "clanTrophyNormalization"){
        dbName = 'carrom-clash-9t32';


    }else if(purpose === "userUnlockCardInvalidate"){
        dbName = 'carrom-clash-9t32`Data`UserData';

    }else{
        throw new Error("unknown purpose!");
    }

    const database = client.db(dbName);
    return database;
}


const resetUserTrophy = async(db) => {

    /**
    * 
    let trophy = gameData.trophy;
    
    if (trophy >= 5200) {
        trophy = 3200;
    } else if (trophy >= 4400 && trophy < 5200) {
        trophy = 2800;
    } else if (trophy >= 3600 && trophy < 4400) {
        trophy = 2400;
    } else if (trophy >= 3200 && trophy < 3600) {
        trophy = 2000;
    } else if (trophy >= 2800 && trophy < 3200) {
        trophy = 1600;
    } else if (trophy >= 2400 && trophy < 2800) {
        trophy = 1200;
    } else if (trophy >= 1200 && trophy < 2400) {
        trophy = 800;
    }
    */


    const {previousSeasonStrikerIds, previousSeasonPowerIds, previousSeasonPuckIds, previousSeasonAvatarIds, previousSeasonFrameIds, previousSeasonEmojiIds} = await PreviousSeasonItems.get();

    const result = await db.collection('Users').updateMany(
        {}, 
        [{
            $set: {
                "gameData.trophy": {
                    $switch: {
                        branches: [
                            { case: { $gte: ["$gameData.trophy", 5200] }, then: 3200 },
                            { case: { $and: [{ $gte: ["$gameData.trophy", 4400] }, { $lt: ["$gameData.trophy", 5200] }] }, then: 2800 },
                            { case: { $and: [{ $gte: ["$gameData.trophy", 3600] }, { $lt: ["$gameData.trophy", 4400] }] }, then: 2400 },
                            { case: { $and: [{ $gte: ["$gameData.trophy", 3200] }, { $lt: ["$gameData.trophy", 3600] }] }, then: 2000 },
                            { case: { $and: [{ $gte: ["$gameData.trophy", 2800] }, { $lt: ["$gameData.trophy", 3200] }] }, then: 1600 },
                            { case: { $and: [{ $gte: ["$gameData.trophy", 2400] }, { $lt: ["$gameData.trophy", 2800] }] }, then: 1200 },
                            { case: { $and: [{ $gte: ["$gameData.trophy", 1200] }, { $lt: ["$gameData.trophy", 2400] }] }, then: 800 }
                        ],
                        default: "$gameData.trophy" 
                    }
                },


                "gameData.carromPass": {
                  isPremiumMember: false,
                  carromPoints: 0,
                  lastAnimationPointer: 0,
                  collectedFree: [],
                  collectedPremium: []
                },


                "profileData.userPicture.avatar": {
                    $cond: {
                        if: { $in: ["$profileData.userPicture.avatar", previousSeasonAvatarIds] },
                        then: "0",
                        else: "$profileData.userPicture.avatar"
                    }
                },
                "profileData.userPicture.frame": {
                    $cond: {
                        if: { $in: ["$profileData.userPicture.frame", previousSeasonFrameIds] },
                        then: 0,
                        else: "$profileData.userPicture.frame"
                    }
                },


                "gameData.collection.striker": {
                    $cond: {
                        if: { $in: ["$gameData.collection.striker.id", previousSeasonStrikerIds] },
                        then: { id: 0, level: 1, collected: 0 },
                        else: "$gameData.collection.striker"
                    }
                },
                "gameData.collection.power": {
                    $cond: {
                        if: { $in: ["$gameData.collection.power.id", previousSeasonPowerIds] },
                        then: { id: 0, level: 1, collected: 0 },
                        else: "$gameData.collection.power"
                    }
                },
                "gameData.collection.puck": {
                    $cond: {
                        if: { $in: ["$gameData.collection.puck.id", previousSeasonPuckIds] },
                        then: { id: 0, level: 1, collected: 0 },
                        else: "$gameData.collection.puck"
                    }
                }
            }
        }]
    );

    return result;
}


const resetClanTrophy = async(db) => {


    /**
     * 
    let clanTrophy = clanTrophy;

    if (clanTrophy >= 2400) {
        clanTrophy = 1500;
    } else if (clanTrophy >= 1800 && clanTrophy < 2400) {
        clanTrophy = 1200;
    } else if (clanTrophy >= 1200 && clanTrophy < 1800) {
        clanTrophy = 900;
    } else if (clanTrophy >= 900 && clanTrophy < 1200) {
        clanTrophy = 600;
    } else if (clanTrophy >= 600 && clanTrophy < 900) {
        clanTrophy = 400;
    } else if (clanTrophy >= 300 && clanTrophy < 600) {
        clanTrophy = 300;
    }
    */

    


    const result = await db.collection('Clans').updateMany(
        {}, 
        [{
            $set: {
                "clanTrophy": {
                    $switch: {
                        branches: [
                            { case: { $gte: ["$clanTrophy", 2400] }, then: 1500 },
                            { case: { $and: [{ $gte: ["$clanTrophy", 1800] }, { $lt: ["$clanTrophy", 2400] }] }, then: 1200 },
                            { case: { $and: [{ $gte: ["$clanTrophy", 1200] }, { $lt: ["$clanTrophy", 1800] }] }, then: 900 },
                            { case: { $and: [{ $gte: ["$clanTrophy", 900] }, { $lt: ["$clanTrophy", 1200] }] }, then: 600 },
                            { case: { $and: [{ $gte: ["$clanTrophy", 600] }, { $lt: ["$clanTrophy", 900] }] }, then: 400 },
                            { case: { $and: [{ $gte: ["$clanTrophy", 300] }, { $lt: ["$clanTrophy", 600] }] }, then: 300 }
                        ],
                        default: "$clanTrophy"
                    }
                }
            }
        }]
    );

    return result;
}

const resetUnlockData = async(db) => {

    const currentTime = Date.now();
    const result = await db.collection('UnlockData').updateMany(
        {}, 
        {
          $pull: {
            strikerUnlocked: { valid: { $lt: currentTime } },
            powerUnlocked: { valid: { $lt: currentTime } },
            puckUnlocked: { valid: { $lt: currentTime } },
            avatarUnlocked: { valid: { $lt: currentTime } },
            frameUnlocked: { valid: { $lt: currentTime } },
            emojiUnlocked: { valid: { $lt: currentTime } }
          }
        }
    );

    return result;
}



module.exports = {
    getDb,
    resetUserTrophy,
    resetClanTrophy,
    resetUnlockData
}