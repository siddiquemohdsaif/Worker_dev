const axios = require('axios');
const BackboneServerUrl = require('../../Utils/BackboneServerUrl');
const WebSocketHttpClient = require('../../Utils/WebSocketHttpClient');
const backboneServerUrl = new BackboneServerUrl();

const getTopPlayers = async () => {
    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/seasonLeaderboardServer/get-top-players-fresh?from=1&to=500');
        return response.data;
    } catch (error) {
        console.error('Error calling getTopPlayers API:', error);
        throw new Error("error :" + error.message);
    }
}

const getTopClans = async () => {
    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/seasonLeaderboardServer/get-top-clans-fresh?from=1&to=500');
        return response.data;
    } catch (error) {
        console.error('Error calling getTopClans API:', error);
        throw new Error("error :" + error.message);
    }
}


const refreshLeaderBoard = async () => {

    await getTopPlayers();
    await getTopClans();
}

const bakboneBroadcastSeasonChange = async () => {

    //tell backbone server to send Notification to user for season reset
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'seasonReset'
    };
    const response = await client.request(queryParams);
    return response;

}


module.exports = {
    refreshLeaderBoard,
    bakboneBroadcastSeasonChange
}