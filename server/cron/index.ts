import { CronJob } from "cron";
import Event from "../event/index";
import { LogUartTerminalDataTransfinite, LogDataClean, LogUserRequst, LogDtuBusy } from "../mongoose/Log";
import { Types } from "mongoose";
import { TerminalClientResults, TerminalClientResult } from "../mongoose/node";
import { Uart } from "typing";

// 数据清洗,清除告警数据中连续的重复的
const DataClean = new CronJob('0 0 19 * * *', async () => {
    console.log(`${new Date().toString()} ### start clean Data.....`);
    const count = {
        NumUserRequst: await CleanUserRequst(),
        NumUartterminaldatatransfinites: await Uartterminaldatatransfinites(),
        NumClientresults: await CleanClientresults(),
        NumClientresultcolltion: "0",//await CleanClientresultcolltion(),
        CleanClientresultsTimeOut: await CleanClientresultsTimeOut(),
        lastDate: DataClean.lastDate()
    }
    await CleanDtuBusy()
    console.log(`${new Date().toString()} ### end clean Data.....`, count);
    new LogDataClean(count).save()

    // 数据缓存重置

    // 重置短信发送数量
    Event.Cache.CacheAlarmSendNum = new Map()
})

// 清洗告警数据
async function Uartterminaldatatransfinites() {
    console.time('Uartterminaldatatransfinites')
    const MapUartterminaldatatransfinites: Map<string, Uart.uartAlarmObject> = new Map()
    const Query = LogUartTerminalDataTransfinite.find({ "__v": 0 })
    const cur = Query.cursor()
    const len = await Query.countDocuments()
    const deleteids: any[] = []
    const allids: any[] = []
    for (let doc = await cur.next() as Uart.uartAlarmObject; doc != null; doc = await cur.next()) {
        const tag = doc.mac + doc.pid + doc.tag
        const _id = Types.ObjectId((doc as any)._id)
        if (MapUartterminaldatatransfinites.has(tag)) {
            const old = MapUartterminaldatatransfinites.get(tag) as Uart.uartAlarmObject
            // 比较同一个设备连续的告警,告警相同则删除后一个记录
            if (old.msg === doc.msg) {
                //await LogUartTerminalDataTransfinite.deleteOne({ _id }).exec()
                deleteids.push(_id)
            } else {
                MapUartterminaldatatransfinites.set(tag, doc)
            }
        } else {
            MapUartterminaldatatransfinites.set(tag, doc)
        }
        allids.push(_id)
    }

    // 批量删除告警日志
    await LogUartTerminalDataTransfinite.deleteMany({ _id: { $in: deleteids } }).exec()
    // 更新标签
    await LogUartTerminalDataTransfinite.updateMany({ _id: { $in: allids } }, { $inc: { "__v": 1 } }).exec()
    console.timeEnd('Uartterminaldatatransfinites');

    return deleteids.length + '/' + len
}

// 清洗请求数据
async function CleanUserRequst() {
    console.time('CleanUserRequst')
    const MapUserRequst: Map<string, Uart.logUserRequst> = new Map()
    const Query = LogUserRequst.find({ "__v": 0 })
    const cur = Query.cursor()
    const len = await Query.countDocuments()
    const deleteids: any[] = []
    const allids: any[] = []
    for (let doc = await cur.next() as Uart.logUserRequst; doc != null; doc = await cur.next()) {
        const tag = doc.user + doc.type
        const _id = Types.ObjectId((doc as any)._id)
        if (MapUserRequst.has(tag)) {
            const old = MapUserRequst.get(tag) as Uart.logUserRequst
            // 比较同一个设备连续的告警,告警相同则删除后一个记录
            if (JSON.stringify(doc.argument) === JSON.stringify(old.argument) || !doc.type) {
                //await LogUserRequst.deleteOne({ _id }).exec()
                deleteids.push(_id)
            } else {
                MapUserRequst.set(tag, doc)
            }
        } else {
            MapUserRequst.set(tag, doc)
        }
        allids.push(_id)
    }
    // 批量删除告警日志
    await LogUserRequst.deleteMany({ _id: { $in: deleteids } }).exec()
    // 更新标签
    await LogUserRequst.updateMany({ _id: { $in: allids } }, { $inc: { "__v": 1 } }).exec()
    console.timeEnd('CleanUserRequst')
    // 清除缓存
    return deleteids.length + '/' + len
}

// 清洗设备原始Result
// 把所有不在现有dtu列表的设备结果集删除
async function CleanClientresults() {
    console.time('CleanClientresults')
    const MapClientresults: Map<string, clientResults> = new Map()
    const Query = TerminalClientResults.find({ "__v": 0 })
    const cur = Query.cursor()
    const len = await Query.countDocuments()
    const deleteids: any[] = []
    const allids: any[] = []

    // 记录文档时间戳
    const timeStamps: number[] = []
    // 
    const dtus = allDtus()

    for (let doc = await cur.next() as Uart.queryResult; doc != null; doc = await cur.next()) {
        const tag = doc.mac + doc.pid
        const _id = Types.ObjectId((doc as any)._id)
        if (dtus.has(tag + doc.protocol)) {
            const oldDoc = MapClientresults.get(tag)
            if (oldDoc) {
                // 比较每个content查询下buffer.data的数据，有不一致则更新缓存，一致的话计入待删除array
                const isrepeat = doc.contents.some(el => {
                    const oldData = oldDoc.maps.get(el.content)
                    return !oldData || oldData.toString() !== el.buffer.data.toString()
                })
                if (isrepeat) MapClientresults.set(tag, clientResultsToMap(doc))
                else {
                    deleteids.push(_id)
                    timeStamps.push(doc.timeStamp)
                }
            } else {
                MapClientresults.set(tag, clientResultsToMap(doc))
            }
            allids.push(_id)
        } else {
            deleteids.push(_id)
            timeStamps.push(doc.timeStamp)
        }
    }
    // 批量删除重复的结果2081447
    await TerminalClientResults.deleteMany({ _id: { $in: deleteids } })//.exec().then(el => console.log(el))
    await TerminalClientResult.deleteMany({ timeStamp: { $in: timeStamps } })//.exec().then(el => console.log(el))
    // 更新标签
    await TerminalClientResults.updateMany({ _id: { $in: allids } }, { $inc: { "__v": 1 } }).exec()
    console.timeEnd('CleanClientresults')
    return deleteids.length + '/' + len
}

// 清洗设备原始Result
// 把所有一个月前的设备结果集删除
async function CleanClientresultsTimeOut() {
    const lastM = Date.now() - 2.592e9
    const len = await TerminalClientResults.countDocuments()
    const result = await TerminalClientResults.deleteMany({ "__v": 1, timeStamp: { $lte: lastM } })

    // 删除告警记录
    await LogUartTerminalDataTransfinite.deleteMany({ timeStamp: { $lte: lastM } })
    return result.deletedCount + '/' + len
}

// 清洗dtuBusy
async function CleanDtuBusy() {
    const BusyMap: Map<string, Uart.logDtuBusy> = new Map()
    const cur = LogDtuBusy.find({ "__v": 0 }).cursor()
    const deleteIds: any[] = []
    const allIds: any[] = []
    for (let doc = await cur.next() as Uart.logDtuBusy; doc != null; doc = await cur.next()) {
        const old = BusyMap.get(doc.mac)
        if (old && doc.timeStamp === old.timeStamp) {
            deleteIds.push(old._id)
            BusyMap.set(doc.mac, doc)
        } else allIds.push(doc._id)
    }
    await LogDtuBusy.remove({ _id: { $in: deleteIds } })
    await LogDtuBusy.updateMany({ _id: { $in: allIds } }, { $set: { "__v": 1 } })
}

// 清洗设备解析Result
/* 思路，比较相同mac,pid的数据，已前者为基准，
    和后者的result中相同的参数值做比较，
    如果值相同，删除后者reult数组中参数，
    不相同的话后者参数值替换掉前者的基准参数值作为比较 
*/
async function CleanClientresultcolltion() {
    console.time('CleanClientresultcolltion')
    const MapClientresultcolltion: Map<string, clientresultcolltions> = new Map()
    const Query = TerminalClientResult.find({ "__v": 0 })
    const cur = Query.cursor()
    const len = await Query.countDocuments()
    // const allids: any[] = []
    for (let doc = await cur.next() as Uart.queryResult; doc != null; doc = await cur.next()) {
        const tag = doc.mac + doc.pid
        const _id = Types.ObjectId((doc as any)._id)
        const oldDoc = MapClientresultcolltion.get(tag)
        if (oldDoc) {
            // 选出新文档和旧文档值相同的参数
            const names = doc.result!.filter(el => {
                const oldData = oldDoc.maps.get(el.name)
                return oldData && oldData.value === el.value
            }).map(el => el.name)

            //  遍历names，把result中不包含names的参数替换到oldMap
            doc.result!.forEach(el => {
                if (!names.includes(el.name)) oldDoc.maps.set(el.name, el)
            })

            // 删除数组中重复值的参数
            await TerminalClientResult.updateOne({ _id }, { $pull: { result: { name: { $in: names } } }, $inc: { "__v": 1 } }).exec()
        } else {
            MapClientresultcolltion.set(tag, clientresultcolltionsToMap(doc))
        }
        // console.log('CleanClientresultcolltion is run' + ` ${allids.length}/${len}, ${(allids.length / len * 100).toFixed(2)}%`);
    }
    console.timeEnd('CleanClientresultcolltion');
    return len
}

export const start = () => {
    console.log(`启用定时任务`);
    DataClean.start()
}
export { Uartterminaldatatransfinites, CleanUserRequst }


// 用于临时保存clientresults缓存对象
interface clientResults extends Pick<Uart.queryResult, "pid" | "mac" | "contents" | "timeStamp"> {
    maps: Map<string, number[]>
}
function clientResultsToMap(clientResults: Uart.queryResult): clientResults {
    const maps = new Map(clientResults.contents.map(el => [el.content, el.buffer.data]))
    return { maps, ...clientResults }
}

// 用于临时保存clientresultcolltion缓存对象
interface clientresultcolltions extends Pick<Uart.queryResult, "pid" | "mac" | "contents" | "timeStamp"> {
    maps: Map<string, Uart.queryResultArgument>
}
function clientresultcolltionsToMap(clientResults: Uart.queryResult): clientresultcolltions {
    const maps = new Map(clientResults.result!.map(el => [el.name, el]))
    return { maps, ...clientResults }
}

// 统计所有dtu挂载设备，
function allDtus() {
    const terminals = Event.Cache.CacheTerminal
    const hashs = [...terminals.values()].map(el => el.mountDevs ? el.mountDevs.map(el2 => el.DevMac + el2.pid + el2.protocol) : []).flat()
    return new Set(hashs)
}