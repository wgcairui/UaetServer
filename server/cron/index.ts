import { CronJob } from "cron";
import { LogUartTerminalDataTransfinite } from "../mongoose/Log";
import { QueryCursor, Document } from "mongoose";

// 数据清洗,清除告警数据中连续的重复的
const DataCleanUartterminaldatatransfinites = new CronJob('0 0 2 * * *', async () => {
    const cur = LogUartTerminalDataTransfinite.find({"__v":0}).cursor()
    while (cur.next) {
        
    }
})

async function Uartterminaldatatransfinites(cur: QueryCursor<Document>){
    
}

export const start = () => {
    console.log(`启用定时任务`);
    DataCleanUartterminaldatatransfinites.start()
}