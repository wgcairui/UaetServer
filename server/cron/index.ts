import { CronJob } from "cron";
import { LogUartTerminalDataTransfinite, LogDataClean, LogUserRequst } from "../mongoose/Log";
import { QueryCursor, Document, Types } from "mongoose";
import { uartAlarmObject, logUserRequst, queryResult } from "../bin/interface";
import { TerminalClientResults, TerminalClientResult } from "../mongoose/node";

// 计数器
let NumUartterminaldatatransfinites = 0
let NumUserRequst = 0
let NumClientresults = 0
let NumClientresultcolltion = 0

// Map缓存
const MapUartterminaldatatransfinites: Map<string, uartAlarmObject> = new Map()
const MapUserRequst: Map<string, logUserRequst> = new Map()
const MapClientresults: Map<string, queryResult> = new Map()
const MapClientresultcolltion: Map<string, queryResult> = new Map()

// 数据清洗,清除告警数据中连续的重复的
const DataClean = new CronJob('0 0 2 * * *', async () => {
    const curUartTerminalDataTransfinite = LogUartTerminalDataTransfinite.find({ "__v": 0 }).cursor()
    const curUserRequst = LogUserRequst.find({ "__v": 0 }).cursor()
    const curClientresults = TerminalClientResults.find({ "__v": 0 }).cursor()
    const curClientresultcolltion = TerminalClientResult.find({ "__v": 0 }).cursor()
    //
    const curArray = [
        CleanUserRequst(curUserRequst),
        Uartterminaldatatransfinites(curUartTerminalDataTransfinite),
        CleanClientresults(curClientresults),
        CleanClientresultcolltion(curClientresultcolltion)
    ] as any[]
    const result = await Promise.all(curArray)

    new LogDataClean(Object.assign({}, ...result, { lastDate: DataClean.lastDate() })).save()
    return result
})

// 清洗告警数据
async function Uartterminaldatatransfinites(cur: QueryCursor<Document>) {
    for (let doc = await cur.next() as uartAlarmObject; doc != null; doc = await cur.next()) {
        NumUartterminaldatatransfinites++
        const tag = doc.mac + doc.pid + doc.tag
        const _id = Types.ObjectId((doc as any)._id)
        if (MapUartterminaldatatransfinites.has(tag)) {
            const old = MapUartterminaldatatransfinites.get(tag) as uartAlarmObject
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
    }
    return { NumUartterminaldatatransfinites }
}

// 清洗请求数据
async function CleanUserRequst(cur: QueryCursor<Document>) {
    for (let doc = await cur.next() as logUserRequst; doc != null; doc = await cur.next()) {
        NumUserRequst++
        const tag = doc.user + doc.type
        const _id = Types.ObjectId((doc as any)._id)
        if (MapUserRequst.has(tag)) {
            const old = MapUserRequst.get(tag) as logUserRequst
            // 比较同一个设备连续的告警,告警相同则删除后一个记录
            if (JSON.stringify(doc.argument) === JSON.stringify(old.argument) || !doc.type) {
                await LogUserRequst.deleteOne({ _id }).exec()
            } else {
                MapUserRequst.set(tag, doc)
            }
        } else {
            MapUserRequst.set(tag, doc)
        }
        await LogUserRequst.updateOne({ _id }, { $inc: { "__v": 1 } }).exec()
    }
    return { NumUserRequst }
}

// 清洗设备原始Result
async function CleanClientresults(cur: QueryCursor<Document>) {
    for (let doc = await cur.next() as queryResult; doc != null; doc = await cur.next()) {
        NumClientresults++
        const tag = doc.mac + doc.pid
        const _id = Types.ObjectId((doc as any)._id)
        if (MapClientresults.has(tag)) {
            const old = MapClientresults.get(tag) as queryResult
            // 比较同一个设备连续的告警,告警相同则删除后一个记录
            const newVal = doc.contents.map(el => el.buffer.data).flat().join()
            const oldVal = old.contents.map(el => el.buffer.data).flat().join()
            if (newVal === oldVal) {
                await TerminalClientResults.deleteOne({ _id }).exec()
            } else {
                MapClientresults.set(tag, doc)
            }
        } else {
            MapClientresults.set(tag, doc)
        }
        await TerminalClientResults.updateOne({ _id }, { $inc: { "__v": 1 } }).exec()
    }
    return { NumClientresults }
}

// 清洗设备解析Result
async function CleanClientresultcolltion(cur: QueryCursor<Document>) {
    for (let doc = await cur.next() as queryResult; doc != null; doc = await cur.next()) {
        NumClientresultcolltion++
        const tag = doc.mac + doc.pid
        const _id = Types.ObjectId((doc as any)._id)
        if (MapClientresultcolltion.has(tag)) {
            const old = MapClientresultcolltion.get(tag) as queryResult
            // 比较同一个设备连续的告警,告警相同则删除后一个记录
            if (JSON.stringify(doc.result) === JSON.stringify(old.result)) {
                await TerminalClientResult.deleteOne({ _id }).exec()
            } else {
                MapClientresultcolltion.set(tag, doc)
            }
        } else {
            MapClientresultcolltion.set(tag, doc)
        }
        await TerminalClientResult.updateOne({ _id }, { $inc: { "__v": 1 } }).exec()
    }
    return { NumClientresultcolltion }
}

export const start = () => {
    console.log(`启用定时任务`);
    DataClean.start()
}
export { Uartterminaldatatransfinites, CleanUserRequst }