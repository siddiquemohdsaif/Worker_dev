const { parentPort, workerData } = require('worker_threads');
const SeasonStackCache = require("./Utils/SeasonStack");
const SeasonHandler = require("./Utils/SeasonHandler");
const EventCache = require("./Utils/Event");
const EventHandler = require("./Utils/EventHandler");
const AppConfigCacheSync = require("./Utils/AppConfigCacheSync");


function getNewSeasonFromStack(SeasonStack) {
    const currentTime = Date.now() + 3000; // delay 3 second
    for (let seasonTime in SeasonStack) {
        if (parseInt(seasonTime) < currentTime) {
            return {id: seasonTime, Season : SeasonStack[seasonTime] };
        }
    }
    return null;
}


async function startSeasonManagerWorker() {
    try {

        //app static doc sync , keep AppConfiguration_v_x.staticCacheInvalidate updated
        AppConfigCacheSync.syncConfing();

        // Load season stack
        const SeasonStack = await SeasonStackCache.get();

        // Get new season from stack
        let SeasonData = getNewSeasonFromStack(SeasonStack);

        // Change season if a new season is available
        if (SeasonData) {
            await SeasonHandler.changeSeason(SeasonData.id, SeasonData.Season);
            await SeasonHandler.doPostTask();
            SeasonStackCache.clear();
        }else{
            //console.log("Season not over yet!");
        }
    } catch (error) {
        console.error('Error in startSeasonManagerWorker:', error);
    }

    // Loop with sleep using setTimeout to avoid stack overflow
    setTimeout(startSeasonManagerWorker, 5000);
}




async function startEventManagerWorker() {
    try {

        // Load event stack
        const Event = await EventCache.get();
        await EventHandler.proccess(Event.EventInfo);
    } catch (error) {
        console.error('Error in startEventManagerWorker:', error);
    }

    // Loop with sleep using setTimeout to avoid stack overflow
    setTimeout(startEventManagerWorker, 10000);
}



// Start the worker
startSeasonManagerWorker();
startEventManagerWorker();
