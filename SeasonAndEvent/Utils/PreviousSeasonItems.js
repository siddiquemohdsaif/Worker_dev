const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

const get = async() => {

    try{

        const carromPass = await firestoreManager.readDocument("Data", "CarromPass", "/");
        const previousSeasonId = `season_${parseInt(carromPass.seasonId.split('_')[1]) - 1}`;

    
        // read docs
        const docList = ["StrikerInfo", "PowerInfo", "PuckInfo", "AvatarInfo", "FrameInfo", "EmojiInfo"];
        const docs = await firestoreManager.bulkReadDocuments("GameInfo", "/", docList, {});
        const [StrikerInfo, PowerInfo, PuckInfo, AvatarInfo, FrameInfo, EmojiInfo] = docs;

        //console.log("previousSeasonId:" + previousSeasonId);
        //console.log(EmojiInfo);
        //console.log(AvatarInfo);
        //console.log(FrameInfo);
        
        const previousSeasonEmojiIds = EmojiInfo.carrom_pass
            .filter(emoji => emoji.seasonId === previousSeasonId)
            .map(emoji => emoji.id);

        const previousSeasonAvatarIds = AvatarInfo.carrom_pass
            .filter(avatar => avatar.seasonId === previousSeasonId)
            .map(avatar =>  String(avatar.id));

        const previousSeasonFrameIds = FrameInfo.carrom_pass
            .filter(frame => frame.seasonId === previousSeasonId)
            .map(frame => frame.id);
       


        const previousSeasonStrikerIds = StrikerInfo.Normal.concat(StrikerInfo.Rare, StrikerInfo.Epic, StrikerInfo.Legendary)
            .filter(striker => striker.seasonId === previousSeasonId)
            .map(striker => striker.id);

        const previousSeasonPowerIds = PowerInfo.Normal.concat(PowerInfo.Rare, PowerInfo.Epic, PowerInfo.Legendary)
            .filter(power => power.seasonId === previousSeasonId)
            .map(power => power.id);

        const previousSeasonPuckIds = PuckInfo.Normal.concat(PuckInfo.Rare, PuckInfo.Epic, PuckInfo.Legendary)
            .filter(puck => puck.seasonId === previousSeasonId)
            .map(puck => puck.id);

        //console.log("previousSeasonEmojiIds:", previousSeasonEmojiIds);
        //console.log("previousSeasonAvatarIds:", previousSeasonAvatarIds);
        //console.log("previousSeasonFrameIds:", previousSeasonFrameIds);
        //console.log("previousSeasonStrikerIds:", previousSeasonStrikerIds);
        //console.log("previousSeasonPowerIds:", previousSeasonPowerIds);
        //console.log("previousSeasonPuckIds:", previousSeasonPuckIds);

        return {previousSeasonStrikerIds, previousSeasonPowerIds, previousSeasonPuckIds, previousSeasonAvatarIds, previousSeasonFrameIds, previousSeasonEmojiIds};

    }catch(e) {
        console.log(e);
        const previousSeasonStrikerIds = [], previousSeasonPowerIds = [], previousSeasonPuckIds = [], previousSeasonAvatarIds = [], previousSeasonFrameIds = [], previousSeasonEmojiIds = [];
        return {previousSeasonStrikerIds, previousSeasonPowerIds, previousSeasonPuckIds, previousSeasonAvatarIds, previousSeasonFrameIds, previousSeasonEmojiIds};

    }

}



module.exports = {
    get
}



















