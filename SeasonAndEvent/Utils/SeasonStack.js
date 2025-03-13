const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for SeasonStack
let seasonStackCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if SeasonStack is in cache and not older than 60 seconds
    if (seasonStackCache.data && (now - seasonStackCache.timestamp) < 60000) {
        return seasonStackCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const seasonStack = await firestoreManager.readDocument("Data", "SeasonStack", "/");
        seasonStackCache = {
            data: seasonStack,
            timestamp: now
        };
        return seasonStack;
    }
};

const clear = () => {
    seasonStackCache = {
        data: null,
        timestamp: null
    };
};


module.exports = {
    get,
    clear
};
