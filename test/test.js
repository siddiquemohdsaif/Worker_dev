const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

const test = async ()=>{
    try{
        const docIds = await firestoreManager.readCollectionDocumentIds('OnGoingWar', '/ClanWar/War');
        console.log(docIds);
    }catch(error){
        console.log(error);
    }
}

test();