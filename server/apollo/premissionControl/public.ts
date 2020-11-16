import { IResolvers } from "apollo-server-koa";
import _ from "lodash"
import { TerminalClientResultSingle, TerminalClientResult, Terminal } from "../../mongoose";
import { Uart } from "typing";

const resolvers: IResolvers<undefined, Uart.ApolloCtx> = {
    Query: {
        // 获取透传设备数据-单条
        async UartTerminalData(root, { DevMac, pid }, ctx) {
            // 获取mac协议
            const protocol = ctx.$Event.Cache.CacheTerminal.get(DevMac)?.mountDevs.find(el => el.pid === pid)?.protocol as string
            // 获取配置显示常量参数
            const ShowTag = ctx.$Event.Cache.CacheConstant.get(protocol)?.ShowTag as string[]
            const data = await TerminalClientResultSingle.findOne({
                mac: DevMac,
                pid
            }).lean<Uart.queryResult>()
            /* const data = await TerminalClientResultSingle.aggregate().match({ mac: DevMac, pid }).unwind('result').match({ 'result.name': { '$in': ShowTag } })
                .group({
                    _id: "$_id", result: { '$push': "$result" }
                }).limit(1)
            console.log(data); */

            // 刷选
            data!.result = ShowTag ? (data!.result?.filter(el => ShowTag?.includes(el.name))) : data!.result
            return data
        },
        // 获取透传设备数据-多条
        async UartTerminalDatas(root, { DevMac, name, pid, datatime }) {
            let result: Uart.queryResultSave[]
            // 如果没有日期参数,默认检索最新的100条数据
            if (datatime === "") {
                result = await TerminalClientResult.find({ mac: DevMac, pid, "result.name": name }, { "result.$": 1, timeStamp: 1 }).sort("-timeStamp").limit(100).lean() as any;
            } else {
                const start = new Date(datatime + " 00:00:00");
                const end = new Date(datatime + " 23:59:59");
                result = await TerminalClientResult.find({ mac: DevMac, pid, "result.name": name }, { "result.$": 1, timeStamp: 1 })
                    .where("timeStamp")
                    .gte(start.getTime())
                    .lte(end.getTime())
                    .sort("-timeStamp")
                    .lean()
            }
            // 把结果拆分为块
            const len = Number.parseInt((result.length / 10).toFixed(0))
            //console.log({len,length:result.length});
            const resultChunk = _.chunk(result, len < 10 ? 10 : len)
            // 遍历切块,刷选出指定字段的结果集,
            const res = resultChunk.map(el => {
                // 刷选切块,如果值相同则抛弃
                let def: Uart.queryResultSave = el[0]
                //def.result = [def.result.find(el2 => el2.name === name) as queryResultArgument]
                return el.reduce((pre, cur) => {
                    // 获取最后一个值
                    const last = _.last(pre) as Uart.queryResultSave
                    //cur.result = [cur.result.find(el2 => el2.name === name) as queryResultArgument]
                    if (cur.result[0] && last.result[0].value !== cur.result[0].value) pre.push(cur)
                    return pre
                }, [def])
            }).flat()
            return res
        },
        // 终端信息
        async Terminal(root, { DevMac }) {
            return await Terminal.findOne({ DevMac });
        },

    },

    
    Mutation: {
    

    }
};

export default resolvers