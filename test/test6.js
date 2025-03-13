
const PostTask = require("../Season/Utils/PostTask");

const FirestoreManager = require("../Firestore/FirestoreManager");
const firestore = FirestoreManager.getInstance();

const test = async() => {
    
    let result = await PostTask.bakboneBroadcastSeasonChange();
    console.log(result);

}

test();

