import { CronJob } from "cron";
import { LogUartTerminalDataTransfinite, LogDataClean } from "../mongoose/Log";
import { QueryCursor, Document, Types } from "mongoose";
import { Uart } from "typing";

// 计数器
let NumUartterminaldatatransfinites = 0

// Map缓存
const MapUartterminaldatatransfinites: Map<string, Uart.uartAlarmObject> = new Map()

// 数据清洗,清除告警数据中连续的重复的


async function Uartterminaldatatransfinites(cur: QueryCursor<Document>) {

    for (let doc = await cur.next(); doc != null; doc = await cur.next()) {
        NumUartterminaldatatransfinites++
        const tag = doc.mac + doc.pid + doc.tag
        const _id = Types.ObjectId((doc as any)._id)
        if (MapUartterminaldatatransfinites.has(tag)) {
            const old = MapUartterminaldatatransfinites.get(tag) as Uart.uartAlarmObject
            // 比较同一个设备连续的告警,告警相同则删除后一个记录
            if (old.msg === doc.msg) {
                await LogUartTerminalDataTransfinite.deleteOne({ _id }).exec()
            } else {
                MapUartterminaldatatransfinites.set(tag, doc)
            }
        } else {
            MapUartterminaldatatransfinites.set(tag, doc)
        }
        await LogUartTerminalDataTransfinite.updateOne({ _id }, { $inc: { "__v": 1 } }).exec()
        console.log('循环' + NumUartterminaldatatransfinites);
    }
    return { NumUartterminaldatatransfinites }
}

async function DataClean() {
    const cur = LogUartTerminalDataTransfinite.find({ "__v": 0 }).cursor()
    const result = await Promise.all([Uartterminaldatatransfinites(cur)])
    console.log(Object.assign({}, ...result));
    
    new LogDataClean(Object.assign({}, ...result)).save()
    return result
}

DataClean()
