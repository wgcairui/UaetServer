import { IResolvers } from "apollo-server-koa";
import { NodeClient, NodeRunInfo, TerminalClientResultSingle, TerminalClientResult, TerminalClientResults } from "../mongoose/node";
import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";
import { Terminal, RegisterTerminal } from "../mongoose/Terminal";
import { EcTerminal } from "../mongoose/EnvironmentalControl";
import { Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout } from "../mongoose/user";
import { BcryptDo } from "../util/bcrypt";
import { DevArgumentAlias, DevConstant } from "../mongoose/DeviceParameterConstant";
import _ from "lodash"
import { LogUserLogins, LogTerminals, LogNodes, LogSmsSend, LogUartTerminalDataTransfinite, LogUserRequst, LogMailSend, LogUseBytes, LogDataClean, LogDtuBusy, LogInstructQuery } from "../mongoose/Log";
import { SendValidation } from "../util/SMS";
import Tool from "../util/tool";
import { JwtSign, JwtVerify } from "../util/Secret";
import * as Cron from "../cron/index";
import { getUserBindDev, localToUtc, validationUserPermission } from "../util/util";
import { ParseCoefficient, ParseFunction } from "../util/func";
import config from "../config";
import HF from "../util/HF";
import { ApolloCtx } from "typing";

const resolvers: IResolvers<any, ApolloCtx> = {
    Query: {
        /**
         * 节点状态
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 指定节点信息
         */
        async Node(root, { IP, Name }, ctx) {

            return await NodeClient.findOne({
                $or: [{ IP: IP || "" }, { Name: Name || "" }]
            });
        },
        /**
         * 获取所有节点信息
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async Nodes(root, arg, ctx) {
            return ctx.$Event.Cache.CacheNode.values();
        },

        /**
         * 获取协议
         * @param root 
         * @param param1 
         * @returns 
         */
        async Protocol(root, { Protocol }) {
            return await DeviceProtocol.findOne({ Protocol });
        },

        /**
         * 获取所有协议
         * @returns 
         */
        async Protocols() {
            return await DeviceProtocol.find();
        },

        /**
         * 获取协议常量
         * @param root 
         * @param param1 
         * @returns 
         */
        async getDevConstant(root, { Protocol }) {
            return await DevConstant.findOne({ Protocol })
        },

        /**
         * 设备类型
         * @param root 
         * @param param1 
         * @returns 
         */
        async DevType(root, { DevModel }) {
            return await DevsType.findOne({ DevModel });
        },

        /**
         * 所有设备类型
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async DevTypes(root, { Type }, ctx) {
            const Types = Type ? { Type } : {}
            return await DevsType.find(Types);
        },

        /**
         * 查询注册终端设备的节点
         * @param root 
         * @param param1 
         * @returns 
         */
        async RegisterTerminal(root, { DevMac }) {
            return await RegisterTerminal.findOne({ DevMac })
        },

        /**
         * 查询节点所属终端
         * @param root 
         * @param param1 
         * @returns 
         */
        async RegisterTerminals(root, { NodeName }) {
            return await RegisterTerminal.find({ mountNode: NodeName })
        },

        /**
         * 终端信息
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        Terminal(root, { DevMac }, ctx) {
            valadationMac(ctx, DevMac)
            return ctx.$Event.Cache.CacheTerminal.get(DevMac)
        },

        /**
         * 检索在线的终端
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        TerminalOnline(root, { DevMac }, ctx) {
            const terminals = ctx.$Event.Cache.CacheTerminal.get(DevMac)
            return terminals && terminals.online ? terminals : null
        },

        /**
         * 获取所有终端信息
         */
        Terminals(root, arg, ctx) {
            return ctx.$Event.Cache.CacheTerminal.values()
        },

        /**
         * 环控终端信息
         * @param root 
         * @param param1 
         * @returns 
         */
        async ECterminal(root, { ECid }) {
            return await EcTerminal.findOne({ ECid });
        },

        /**
         * 环控终端信息
         * @returns 
         */
        async EcTerminals() {
            return await EcTerminal.find({});
        },

        /**
         * 节点信息
         * @param root 
         * @param param1 
         * @returns 
         */
        async NodeInfo(root, { NodeName }) {
            return await NodeRunInfo.find(NodeName ? { NodeName } : {});
        },

        /**
         * 用户
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async User(root, { user }, ctx) {
            return await Users.findOne({ user: ctx.user });
        },

        /**
         * 获取所有用户
         * @returns 
         */
        async Users() {
            return await Users.find();
        },

        /**
         * 绑定设备信息
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async BindDevice(root, arg, ctx) {
            const Bind = ctx.$Event.Cache.CacheBind.get(ctx.user)
            if (!Bind) return null;
            const UTs = [...ctx.$Event.Cache.CacheTerminal.values()].filter(el => Bind.UTs.includes(el.DevMac)) //await Terminal.find({ DevMac: { $in: Bind.UTs } }).lean();
            const ECs = await EcTerminal.find({ ECid: { $in: Bind.ECs } }).lean();
            const AGG = await UserAggregation.find({ user: ctx.user })
            return {
                UTs,
                ECs,
                AGG
            };
        },

        /**
         * 绑定设备信息
         * @returns 
         */
        async BindDevices() {
            return await UserBindDevice.find({}).lean();
        },

        /**
         * 获取用户组
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        userGroup(root, arg, ctx) {
            return ctx.userGroup;
        },

        /**
         * 获取透传设备数据-单条
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async UartTerminalData(root, { DevMac, pid }, ctx) {
            valadationMac(ctx, DevMac)
            const data = await TerminalClientResultSingle.findOne({ mac: DevMac, pid });
            if (data && data.result) {
                // 获取mac协议
                const protocol = ctx.$Event.getClientDtuMountDev(DevMac, pid).protocol
                // 获取配置显示常量参数
                const ShowTag = ctx.$Event.Cache.CacheConstant.get(protocol)?.ShowTag
                // 刷选
                if (ShowTag) data.result = data.result.filter(el => ShowTag?.includes(el.name))
                // 检查设备是否有别名
                const alias = ctx.$Event.Cache.CacheAlias.get(DevMac + pid + protocol)
                if (alias) data.result = data.result.map(el => {
                    el.alias = alias.get(el.name) || el.name
                    return el
                })
            }
            return data
        },

        /**
         * 获取透传设备数据-多条
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async UartTerminalDatas(root, { DevMac, name, pid, datatime }, ctx) {
            valadationMac(ctx, DevMac)
            let result: Uart.queryResultSave[]
            // 如果没有日期参数,默认检索最新的100条数据
            const Query = TerminalClientResult.find({ mac: DevMac, pid, "result.name": name }, { "result.$": 1, timeStamp: 1 })
            if (datatime === "") {
                return await Query.limit(50)
            } else {
                const [start, end] = [localToUtc(datatime + " 0:0:0", ctx.language), localToUtc(datatime + " 23:59:59", ctx.language)];
                const result = await Query.where("timeStamp").gte(start).lte(end)
                if (result.length < 50) {
                    return _.sortBy(result, 'timeStamp')
                }
                // 把结果拆分为块,50等分
                const len = Number.parseInt((result.length / 50).toFixed(0))
                const resultChunk = _.chunk(result.map(els => {
                    els.tempValue = els.result[0].value
                    return els
                }), len < 10 ? 10 : len)
                // 遍历切块,刷选出指定字段的结果集,
                /*const res = resultChunk.map(el => {
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
                }).flat()*/

                // console.log({ len, result: result.length, resultChunk: resultChunk.length });
                // 遍历切块，获取每块中数值最大的记录和数值最小的记录
                const arrs = resultChunk.map(el => [_.maxBy(el, 'tempValue')!, _.minBy(el, 'tempValue')!]).flat()
                return _.sortBy(arrs, 'timeStamp')
            }

        },

        /**
         * 获取设备在线状态
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        getDevState(root, { mac, node }, ctx) {
            return ctx.$Event.Cache.CacheTerminal.get(mac)?.online || false
        },

        /**
         * 获取用户自定义配置
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async getUserSetup(root, arg, ctx) {
            return await UserAlarmSetup.findOne({ user: ctx.user })
        },

        /**
         * 获取用户自定义配置
         * @returns 
         */
        async getUserSetups() {
            return await UserAlarmSetup.find()
        },

        /**
         * 获取协议常量
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async getUserDevConstant(root, { Protocol }, ctx) {
            const userSetup = ctx.$Event.Cache.CacheUserSetup.get(ctx.user)!
            const res = userSetup.ProtocolSetupMap.get(Protocol)
            return res
        },

        /**
         * 获取用户设备日志
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async getLogTerminal(root, arg, ctx) {
            //获取用户绑定设备列表
            const BindDevs = ctx.$Event.Cache.CacheBind.get(ctx.user)?.UTs as string[] || [] as string[]
            const result = await LogTerminals.find({ TerminalMac: { $in: BindDevs } })//.find({ TerminalMac: { $in: BindDevs } })
            return result
        },

        /**
         * 获取用户tel
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async getUserTel(root, arg, ctx) {
            return Tool.Mixtel(ctx.$Event.Cache.CacheUser.get(ctx.user)!.tel)
        },

        /**
         * 获取socket node状态
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        getSocketNode(root, arg, ctx) {
            return [...ctx.$Event.Cache.CacheTerminal.values()].filter(el => el.online)
        },

        /**
         * 获取socket user状态
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        getUserNode(root, arg, ctx) {
            const userids = new Map() as Map<string, Set<string>>
            if (ctx.$Event.clientSocket) {
                ctx.$Event.clientSocket.CacheSocketidUser.forEach((val) => {
                    userids.set(val, new Set(['web']))
                })
            }
            if (ctx.$Event.wxSocket) {
                ctx.$Event.wxSocket.clients.forEach((val, key) => {
                    if (userids.has(key)) {
                        const set = userids.get(key)!.add('wx')
                        userids.set(key, set)
                    } else {
                        userids.set(key, new Set(['wx']))
                    }
                })
            }

            return Array.from(userids).map(([user, set]) => ({ user, set: Array.from(set) }))
        },

        /**
         * 获取节点日志
         * @param root 
         * @param param1 
         * @returns 
         */
        async lognodes(root, { start, end }) {
            return await LogNodes.find().where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取终端日志
         * @param root 
         * @param param1 
         * @returns 
         */
        async logterminals(root, { start, end }) {
            return await LogTerminals.find().where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取终端日志
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async userlogterminals(root, { start, end, mac }, ctx) {
            const UserBindDevice = ctx.$Event.Cache.CacheBind.get(ctx.user)?.UTs as string[]
            if (!UserBindDevice || (mac && !UserBindDevice.includes(mac))) return null
            const types = ['连接', '断开'] as any[]
            return await LogTerminals.find({ TerminalMac: mac, type: { $in: types } }).where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取短信日志
         */
        async logsmssends(root, { start, end }) {
            return await LogSmsSend.find().where("createdAt").gte(start).lte(end)
        },

        /**
         * 获取邮件日志
         */
        async logmailsends(root, { start, end }) {
            return await LogMailSend.find().where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取设备告警日志
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async loguartterminaldatatransfinites(root, { start, end }, ctx) {
            const query = LogUartTerminalDataTransfinite.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
            // 如果未清洗的数据查询结果的大于N条,则先清洗数据
            if (await query.countDocuments() > 2000) {
                await Cron.Uartterminaldatatransfinites()
            }
            if (ctx.userGroup === "user") {
                //获取用户绑定设备列表
                const BindDevs: string[] = getUserBindDev(ctx.user)
                /* ctx.$Event.Cache.CacheBindUart.forEach((val, key) => {
                    if (val === ctx.user) BindDevs.push(key)
                }) */
                //let result = await LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).where("createdAt").gte(start).lte(end).lean()
                const logCur = LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).where("createdAt").gte(start).lte(end)
                const logCurCount = await logCur.countDocuments()
                let result = [] as Uart.uartAlarmObject[]
                if (logCurCount > 0) {
                    if (logCurCount > 200) {
                        result = await logCur.find().sort("-timeStamp").limit(200).lean()
                    } else {
                        result = await logCur.find().lean()
                    }
                } else {
                    result = await LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).sort("-timeStamp").limit(50).lean()
                }
                const terminalMaps = ctx.$Event.Cache.CacheTerminal
                const arr = result.map(el => {
                    el.mac = terminalMaps.get(el.mac)?.name || el.mac
                    return el
                })
                return _.sortBy(arr, (item) => {
                    return -item.timeStamp
                })
            } else {
                return await LogUartTerminalDataTransfinite.find().where("createdAt").gte(start).lte(end).exec()
            }
        },

        /**
         * 获取用户登陆日志
         * @param root 
         * @param param1 
         * @returns 
         */
        async loguserlogins(root, { start, end }) {
            return await LogUserLogins.find().where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取用户请求日志
         * @param root 
         * @param param1 
         * @returns 
         */
        async loguserrequsts(root, { start, end }) {
            const query = LogUserRequst.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
            // 如果未清洗的数据查询结果的大于N条,则先清洗数据
            if (await query.countDocuments() > 2000) {
                await Cron.CleanUserRequst()
            }
            return await LogUserRequst.find().where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取设备原始数据
         * @param root 
         * @param param1 
         */
        async ClientResults(root, { start, end, id }: { start: Date, end: Date, id: string }) {
            if (id) {
                return [await TerminalClientResults.findById(id)]
            } else {
                const [startStamp, endStamp] = [new Date(start).getTime(), new Date(end).getTime()]
                return await TerminalClientResults.find().where("timeStamp").gte(startStamp).lte(endStamp)
            }

        },

        /**
         * 获取设备解析数据
         * @param root 
         * @param param1 
         */
        async ClientResult(root, { start, end, id }: { start: Date, end: Date, id: string }) {
            if (id) {
                const result = await TerminalClientResult.findById(id)
                console.log(id, result);

                return [result]
            } else {
                const [startStamp, endStamp] = [new Date(start).getTime(), new Date(end).getTime()]
                return await TerminalClientResult.find().where("timeStamp").gte(startStamp).lte(endStamp)
            }
        },

        /**
         * 获取设备单例数据
         * @param root 
         * @param param1 
         */
        async ClientResultSingle() {
            return await TerminalClientResultSingle.find()
        },

        /**
         * 获取设备使用流量
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async logterminaluseBtyes(root, { mac }, ctx) {
            return await LogUseBytes.find({ mac }).exec()
        },

        /**
         * 获取定时清理记录
         * @param root 
         * @param param1 
         * @returns 
         */
        async logdataclean(root, { start, end }) {
            return await LogDataClean.find().where("createdAt").gte(start).lte(end).exec()
        },

        /**
         * 获取dtu繁忙状态记录
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async logDtuBusy(root, { mac, start, end }, ctx) {
            return await LogDtuBusy.find({ mac }).where("timeStamp").gt(new Date(start).getTime()).lt(new Date(end).getTime()).exec()
        },

        /**
         * 获取dtu发送指令记录
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async logInstructQuery(root, { mac }, ctx) {
            return await LogInstructQuery.find({ mac }).exec()
        },

        /**
         * 获取在线节点指令缓存
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        getNodeInstructQuery(root, arg, ctx) {
            return [...ctx.$Event.uartSocket.CacheSocket].map(([node, client]) => {
                return { node, instruct: [...client.cache.values()] }
            })
        },

        /**
         * id获取用户聚合设备
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async Aggregation(root, { id }, ctx) {
            const agg = await UserAggregation.findOne({ id, user: ctx.user }).lean()
            if (!agg) return agg
            const result = []
            for (let el of agg.aggregations) {
                const data = ctx.$Event.Cache.CacheDevsData.get(el.DevMac + el.pid)?.result || []
                result.push({ ...el, result: data })
            }
            /* 
            const query = agg.aggregations.map(async (el:Uart.AggregationDev) => {
                // 获取设备协议常量
                // const constant = ctx.$Event.Cache.CacheConstant.get(el.protocol)!
                // const constantVals = new Set(Object.values(constant.Constant).map(el2 => Array.isArray(el2) ? el2 : [el2]).flat())
                const ter = await TerminalClientResultSingle.findOne({ mac: el.DevMac, pid: el.pid })
                // el.result = ter!.result?.filter(el => constantVals.has(el.name))
                el.result = ter!.result ||[]
                
                return el
            }) */
            return result
        },

        /**
         * 获取后台运行状态
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async runingState(root, arg, ctx) {
            if (ctx.userGroup === 'root') {
                const Event = ctx.$Event
                const Cache = Event.Cache
                // 在线用户
                const User = {
                    online: new Set([...Event.clientSocket.CacheSocketidUser.values(), ...Event.wxSocket.clients.keys()]).size,
                    all: await Users.countDocuments().exec()
                }
                // 在线节点
                const Node = {
                    online: Event.uartSocket?.CacheSocket.size || 0,
                    all: Cache.CacheNode.size
                }
                // 在线终端
                const Terminal = {
                    online: [...Cache.CacheTerminal].filter(el => el[1].online).length,
                    all: Cache.CacheTerminal.size
                }
                // 所以协议
                const Protocol = Cache.CacheProtocol.size
                // 超时设备数量
                const TimeOutMonutDev = [...Cache.CacheTerminal.values()].map(el => {
                    if (el.online) {
                        return el.mountDevs ? el.mountDevs.filter(e2 => !e2.online).length : 0
                    } else {
                        return el.mountDevs.length || 0
                    }
                }).reduce((pre, cu) => pre + cu)
                // 系统事件总数
                const events = Event.eventNames()
                // 系统性能
                const SysInfo = Tool.NodeInfo()
                return { User, Node, Terminal, Protocol, TimeOutMonutDev, events, SysInfo }
            }
            else return null
        },

        /**
         * 检查挂载设备是否在超时列表中
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        checkDevTimeOut(root, { mac, pid }: { mac: string, pid: string }, ctx) {
            if (!ctx.$Event.Cache.CacheTerminal.get(mac)?.online) return 'DTUOFF'
            if (!ctx.$Event.getClientDtuMountDev(mac, pid).online) return 'TimeOut'
            return 'online'
        },

        /**
         * 获取设备设备别名
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async getAlias(root, { mac, pid, protocol }, ctx) {
            return await DevArgumentAlias.findOne({ mac, pid, protocol })
        },

        /**
         * 获取用户布局配置
         */
        async getUserLayout(root, { id }, ctx) {
            return await UserLayout.findOne({ id, user: ctx.user })
        },

        /**
         * 获取dtu远程调试地址
         */
        async iotRemoteUrl(root, { mac }, ctx) {
            valadationRoot(ctx)
            return await HF.macRemote(mac)
        }
    },



















    Mutation: {

        /**
         * 设置节点
         */
        async setNode(root, { arg }, ctx) {
            valadationRoot(ctx)
            const { Name, IP, Port, MaxConnections } = JSON.parse(arg);
            const result = await NodeClient.updateOne(
                { IP },
                { $set: { Name, Port, MaxConnections } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheNode();
            return result;
        },

        /**
         * 删除节点
         */
        async deleteNode(root, { IP }, ctx) {
            valadationRoot(ctx)
            const result = await NodeClient.deleteOne({ IP });
            await ctx.$Event.Cache.RefreshCacheNode();
            return result;
        },

        /**
         * 设置协议
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async setProtocol(root, { arg }, ctx) {
            valadationRoot(ctx)
            const { Type, ProtocolType, Protocol, instruct } = arg;
            const result = await DeviceProtocol.updateOne(
                { Type, Protocol },
                { $set: { ProtocolType, instruct } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheProtocol(Protocol);
            return result;
        },

        /**
         * 设置协议
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async TestScriptStart(root, { arg }: { arg: Uart.protocolInstruct }, ctx) {
            const Fun = ParseFunction(arg.scriptStart)
            const msg = Fun(1, arg.name)
            return {
                ok: 1,
                msg
            } as Uart.ApolloMongoResult
        },

        /**
         * 删除协议
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async deleteProtocol(root, { Protocol }, ctx) {
            valadationRoot(ctx)
            const result = await DeviceProtocol.deleteOne({ Protocol });
            ctx.$Event.Cache.CacheProtocol.delete(Protocol)
            return result;
        },

        /**
         * 添加设备类型
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addDevType(root, { arg }, ctx) {
            valadationRoot(ctx)
            const { Type, DevModel, Protocols } = arg;
            const result = await DevsType.updateOne(
                { Type, DevModel },
                { $set: { Protocols } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheDevType(DevModel);
            return result;
        },

        /**
         * 添加设备类型
         */
        async deleteDevModel(root, { DevModel }, ctx) {
            valadationRoot(ctx)
            const result = await DevsType.deleteOne({ DevModel });
            ctx.$Event.Cache.CacheDevsType.delete(DevModel)
            return result;
        },

        /**
         * 添加登记设备
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addRegisterTerminal(root, { DevMac, mountNode }, ctx) {
            valadationRoot(ctx)
            await new RegisterTerminal({ DevMac, mountNode }).save()
            const result = await Terminal.updateOne(
                { DevMac },
                { $set: { mountNode, name: DevMac } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },

        /**
         * 删除登记设备
         */
        async deleteRegisterTerminal(root, { DevMac }, ctx) {
            valadationRoot(ctx)
            // 如果没有被绑定则删除
            const terminal = await UserBindDevice.findOne({ "UTS": DevMac })
            if (terminal) {
                return { ok: 0, msg: "设备已被用户绑定" }
            } else {
                await TerminalClientResult.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResults.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResultSingle.deleteMany({ mac: DevMac }).exec()
                await Terminal.deleteOne({ DevMac }).exec()
                await LogUartTerminalDataTransfinite.deleteMany({ mac: DevMac }).exec()
                await LogTerminals.deleteMany({ TerminalMac: DevMac }).exec()
                await LogUseBytes.deleteMany({ mac: DevMac }).exec()
                const result = await RegisterTerminal.deleteOne({ DevMac }).lean()
                ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
                return result
            }
        },

        /**
         * 添加终端信息
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addTerminal(root, { arg }, ctx) {
            const { DevMac, name, mountNode, mountDevs } = arg;
            const result = await Terminal.updateOne(
                { DevMac, name, mountNode },
                { $set: { mountDevs } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },

        /**
         * 修改终端
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async modifyTerminal(root, { DevMac, arg }, ctx) {
            if (ctx.userGroup === 'user') {
                valadationMac(ctx, DevMac)
            }
            const result = await Terminal.updateOne(
                { DevMac },
                { $set: arg },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },

        /**
         * 删除终端信息
         */
        async deleteTerminal(root, { DevMac }, ctx) {
            valadationRoot(ctx)
            // 如果没有被绑定则删除
            const terminal = await UserBindDevice.findOne({ "UTS": DevMac })
            if (terminal) {
                return { ok: 0, msg: "设备已被用户绑定" }
            } else {
                await TerminalClientResult.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResults.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResultSingle.deleteMany({ mac: DevMac }).exec()
                await Terminal.deleteOne({ DevMac }).exec()
                await LogUartTerminalDataTransfinite.deleteMany({ mac: DevMac }).exec()
                await LogTerminals.deleteMany({ TerminalMac: DevMac }).exec()
                await LogUseBytes.deleteMany({ mac: DevMac }).exec()
                const result = await RegisterTerminal.deleteOne({ DevMac })
                ctx.$Event.Cache.CacheTerminal.delete(DevMac)
                return result
            }
        },

        /**
         * 添加终端挂载信息
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addTerminalMountDev(root, { arg }, ctx) {
            const { DevMac, Type, mountNode, mountDev, protocol, pid } = arg;
            const result = await Terminal.updateOne(
                { DevMac },
                {
                    $addToSet: {
                        mountDevs: {
                            Type,
                            mountDev,
                            protocol,
                            pid
                        }
                    }
                }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },

        /**
         * 删除终端挂载设备
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async delTerminalMountDev(root, { DevMac, mountDev, pid }, ctx) {
            valadationMac(ctx, DevMac)
            const result = await Terminal.updateOne({ DevMac }, { $pull: { mountDevs: { mountDev, pid } } })
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
            return result
        },

        /**
         * 修改终端挂载设备
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async modifyTerminalMountDev(root, { DevMac, pid, arg }, ctx) {
            valadationMac(ctx, DevMac)
            const result = await Terminal.updateOne({ DevMac, 'mountDevs.pid': pid }, { $set: { "mountDevs.$": arg } })
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
            return result
        },

        /**
         * 添加用户
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addUser(root, { arg }, ctx) {
            if (await Users.findOne({ user: arg.user })) return { ok: 0, msg: "账号有重复,请重新编写账号" };
            if (await Users.findOne({ tel: arg.tel || '' })) return { ok: 0, msg: "手机号码有重复,请重新填写号码" };
            if (await Users.findOne({ mail: arg.mail || '' })) return { ok: 0, msg: "邮箱账号有重复,请重新填写邮箱" };
            const user = Object.assign(arg, { passwd: await BcryptDo(arg.passwd) }) as Uart.UserInfo
            const User = new Users(user);
            return await User.save()
                .then(() => {
                    // 生成用户新的自定义配置
                    const setup: Partial<Uart.userSetup> = {
                        user: user.user,
                        tels: user.tel ? [String(user.tel)] : [],
                        mails: user.mail ? [user.mail] : []
                    }
                    // 
                    ctx.$Event.Cache.RefreshCacheUser(user.user)
                    ctx.$Event.Cache.RefreshCacheUserSetup(user.user)
                    new UserAlarmSetup(setup).save()
                    // 添加日志记录
                    new LogUserLogins({ user: user.user, type: '用户注册' } as Uart.logUserLogins).save()
                    return { ok: 1, msg: "账号注册成功" };
                })
                .catch((e) => console.log(e));
        },

        /**
         * 修改用户信息
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async modifyUserInfo(root, { arg }, ctx) {
            const keys = Object.keys(arg)
            if (keys.includes('user')) return { ok: 0, msg: '不能修改用户名' } as Uart.ApolloMongoResult
            if (keys.includes('userGroup') && ctx.userGroup !== 'root') return { ok: 0, msg: '权限校验失败' } as Uart.ApolloMongoResult
            if (keys.some(el => arg[el].length > 50)) return { ok: 0, msg: '参数值过长' } as Uart.ApolloMongoResult
            const res = await Users.updateOne({ user: ctx.user }, { $set: arg })
            ctx.$Event.Cache.RefreshCacheUser(ctx.user)
            return res
        },
        /**
         * 更新用户信息
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async updateUserInfo(root, { arg }: { arg: Uart.UserInfo }, ctx) {
            if (arg.user && arg.user === ctx.user) {
                const res = await Users.updateOne({ user: ctx.user }, { $set: { ...arg } })
                ctx.$Event.Cache.RefreshCacheUser(ctx.user)
                return res
            } else {
                return { ok: 0, msg: '权限校验失败' }
            }
        },

        /**
         * 添加用户绑定终端
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addUserTerminal(root, { type, id }, ctx) {
            switch (type) {
                case "UT":
                    {
                        if (config.vmDevs.includes(id)) {
                            return { ok: 0, msg: `虚拟设备无法绑定` } as Uart.ApolloMongoResult
                        }
                        const isBind = await UserBindDevice.findOne({ UTs: id }).exec()
                        if (isBind) {
                            return { ok: 0, msg: `${id}设备已被绑定` } as Uart.ApolloMongoResult
                        } else {
                            const result = await UserBindDevice.updateOne(
                                { user: ctx.user },
                                { $addToSet: { UTs: id } },
                                { upsert: true }
                            );
                            ctx.$Event.Cache.RefreshCacheBind(ctx.user)
                            return result
                        }

                    }
                case "EC":
                    {
                        const isBind = await UserBindDevice.findOne({ "ECS": id })
                        if (isBind) {
                            return { ok: 0, msg: `${id}设备已被绑定` } as Uart.ApolloMongoResult
                        } else {
                            const res = await UserBindDevice.updateOne(
                                { user: ctx.user },
                                { $addToSet: { ECs: id } },
                                { upsert: true }
                            );
                            ctx.$Event.Cache.RefreshCacheBind(ctx.user)
                            return res
                        }
                    }
            }
        },

        /**
         * 添加用户绑定终端
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async delUserTerminal(root, { type, id }, ctx) {
            switch (type) {
                case "UT":
                    {
                        const res = await UserBindDevice.updateOne(
                            { user: ctx.user },
                            { $pull: { UTs: id } },
                            { upsert: true }
                        );
                        ctx.$Event.Cache.CacheBindUart.delete(id)
                        ctx.$Event.Cache.RefreshCacheBind(ctx.user)
                        return res
                    }
                case "EC":
                    {
                        const res = await UserBindDevice.updateOne(
                            { user: ctx.user },
                            { $pull: { ECs: id } },
                            { upsert: true }
                        );
                        ctx.$Event.Cache.RefreshCacheBind(ctx.user)
                        return res
                    }
            }
        },

        /**
         * 添加设备协议常量配置
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addDevConstent(
            root,
            {
                ProtocolType,
                Protocol,
                type,
                arg
            }: {
                ProtocolType: string;
                Protocol: string;
                type: Uart.ConstantThresholdType
                arg:
                | Uart.DevConstant_Air
                | Uart.DevConstant_Ups
                | Uart.DevConstant_EM
                | Uart.DevConstant_TH
                | string[]
                | Uart.OprateInstruct

            }, ctx
        ) {
            valadationRoot(ctx)
            let Up: any
            switch (type) {
                case "Constant":
                    Up = { Constant: arg }
                    break
                case "Threshold":
                    Up = { Threshold: arg }
                    break
                case "ShowTag":
                    Up = { ShowTag: _.compact(arg as string[]) }
                    break
                case "AlarmStat":
                    Up = { AlarmStat: arg }
                    break
                case "Oprate":
                    Up = { OprateInstruct: arg }
                    break
            }
            const result = await DevConstant.updateOne(
                { Protocol, ProtocolType },
                { $set: Up },
                { upsert: true }
            )
            ctx.$Event.Cache.RefreshCacheConstant(Protocol)
            return result;
        },

        /**
         * 固定发送设备操作指令
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async SendProcotolInstructSet(root, { query, item }: { query: Uart.instructQueryArg, item: Uart.OprateInstruct }, ctx) {
            // 验证客户是否校验过权限
            const juri = ctx.$Event.ClientCache.CacheUserJurisdiction.get(ctx.user as string)
            if (!juri || juri !== ctx.$token) {
                return { ok: 4, msg: "权限校验失败,请校验身份" } as Uart.ApolloMongoResult
            }
            // 获取协议指令
            const protocol = ctx.$Event.Cache.CacheProtocol.get(query.protocol)!
            // 携带事件名称，触发指令查询
            const Query: Uart.instructQuery = {
                protocol: query.protocol,
                DevMac: query.DevMac,
                pid: query.pid,
                type: protocol.Type,
                events: 'oprate' + Date.now() + query.DevMac,
                content: item.value
            }
            // 检查操作指令是否含有自定义参数
            if (/(%i)/.test(item.value)) {
                // 如果识别字为%i%i,则把值转换为四个字节的hex字符串,否则转换为两个字节
                if (/%i%i/.test(item.value)) {
                    const b = Buffer.allocUnsafe(2)
                    b.writeIntBE(ParseCoefficient(item.bl, Number(item.val)), 0, 2)
                    Query.content = item.value.replace(/(%i%i)/, b.slice(0, 2).toString("hex"))
                } else {
                    const val = ParseCoefficient(item.bl, Number(item.val)).toString(16)
                    Query.content = item.value.replace(/(%i)/, val.length < 2 ? val.padStart(2, '0') : val)
                }
            }
            console.log({ msg: '发送查询指令', Query });

            const result = await ctx.$Event.DTU_OprateInstruct(Query)
            return result
        },

        /**
         * 固定发送DTU AT指令
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async Send_DTU_AT_InstructSet(root, { DevMac, content }: { DevMac: string, content: string }, ctx) {
            valadationRoot(ctx)
            // 获取协议指令
            // 携带事件名称，触发指令查询
            const Query: Uart.DTUoprate = {
                DevMac,
                events: 'QueryAT' + Date.now() + DevMac,
                content
            }
            const result = await ctx.$Event.DTU_ATInstruct(Query)
            return result
        },

        /**
         * 设置用户自定义设置(联系方式)
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async setUserSetupContact(root, { tels, mails }: { tels: string[], mails: string[] }, ctx) {
            const result = await UserAlarmSetup.updateOne({ user: ctx.user }, { $set: { tels: tels || [ctx.tel], mails: mails || [ctx.mail] } }, { upsert: true })
            ctx.$Event.Cache.RefreshCacheUserSetup(ctx.user)
            return result
        },

        /**
         * 设置用户自定义设置(协议配置)
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async setUserSetupProtocol(root, { Protocol, type, arg }: { Protocol: string, type: Uart.ConstantThresholdType, arg: any }, ctx) {
            // 获取用户告警配置
            const setup = await UserAlarmSetup.findOne({ user: ctx.user }).lean<Pick<Uart.userSetup, 'user' | 'mails' | 'tels' | 'ProtocolSetup'>>()!
            // 如果没有初始配置则新建
            if (!setup) {
                await new UserAlarmSetup({ user: ctx.user, mails: [], tels: [], ProtocolSetup: [] }).save()
            }
            // 如果如果没有ProtocolSetup属性或ProtocolSetup中没有此协议则加入
            if (!setup?.ProtocolSetup || setup.ProtocolSetup.findIndex(el => el.Protocol === Protocol) === -1) {
                await UserAlarmSetup.updateOne({ user: ctx.user }, { $push: { ProtocolSetup: { Protocol } } }, { upsert: true }).exec()
            }
            let result;
            switch (type) {
                case "Threshold":
                    {
                        const { type, data }: { type: 'del' | 'add', data: Uart.Threshold } = arg
                        if (type === 'del') {
                            result = await UserAlarmSetup.updateOne(
                                { user: ctx.user, "ProtocolSetup.Protocol": Protocol },
                                { $pull: { "ProtocolSetup.$.Threshold": { name: data.name } } }
                            )
                        } else {
                            const has = await UserAlarmSetup.findOne({ user: ctx.user, ProtocolSetup: { $elemMatch: { "Protocol": Protocol, "Threshold.name": data.name } } })
                            if (has) {
                                // https://www.cnblogs.com/zhongchengyi/p/12162792.html
                                result = await UserAlarmSetup.updateOne(
                                    { user: ctx.user },
                                    { $set: { "ProtocolSetup.$[i1].Threshold.$[i2]": data } },
                                    {
                                        arrayFilters: [
                                            { "i1.Protocol": Protocol },
                                            { "i2.name": data.name }
                                        ]
                                    }
                                )
                            } else {
                                result = await UserAlarmSetup.updateOne(
                                    { user: ctx.user, "ProtocolSetup.Protocol": Protocol },
                                    { $push: { "ProtocolSetup.$.Threshold": data } },
                                    { upsert: true }
                                )
                            }

                        }
                    }
                    break
                case "ShowTag":
                    {
                        result = await UserAlarmSetup.updateOne(
                            { user: ctx.user, "ProtocolSetup.Protocol": Protocol },
                            { $set: { "ProtocolSetup.$.ShowTag": _.compact(arg as string[]) } },
                            { upsert: true }
                        )
                    }
                    break
                case "AlarmStat":
                    {
                        const { name, alarmStat } = arg
                        // 检查系统中是否含有name的配置
                        const has = await UserAlarmSetup.findOne({ user: ctx.user, ProtocolSetup: { $elemMatch: { "Protocol": Protocol, "AlarmStat.name": name } } })
                        if (has) {
                            // https://www.cnblogs.com/zhongchengyi/p/12162792.html
                            result = await UserAlarmSetup.updateOne(
                                { user: ctx.user },
                                { $set: { "ProtocolSetup.$[i1].AlarmStat.$[i2].alarmStat": alarmStat } },
                                {
                                    arrayFilters: [
                                        { "i1.Protocol": Protocol },
                                        { "i2.name": name }
                                    ]
                                }
                            )
                        } else {
                            result = await UserAlarmSetup.updateOne(
                                { user: ctx.user, "ProtocolSetup.Protocol": Protocol },
                                { $push: { "ProtocolSetup.$.AlarmStat": { name, alarmStat } } },
                                { upsert: true }
                            )
                        }
                    }
                    break
            }

            ctx.$Event.Cache.RefreshCacheUserSetup(ctx.user)
            return result;
        },
        /**
         * 发送验证码
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async sendValidationSms(root, arg, ctx) {
            const user = await Users.findOne({ user: ctx.user }).lean<Uart.UserInfo>()
            const code = (Math.random() * 10000).toFixed(0)
            ctx.$Event.ClientCache.CacheUserValidationCode.set(ctx.$token, code)
            return await SendValidation(String(user!.tel), code)
        },

        /**
         * 校验验证码,校验通过缓存授权
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        ValidationCode(root, { code }, ctx) {
            const userCode = ctx.$Event.ClientCache.CacheUserValidationCode.get(ctx.$token)
            if (!userCode || !code) return { ok: 0, msg: '校验码不存在,请重新发送校验码' } as Uart.ApolloMongoResult
            if (userCode !== code) return { ok: 0, msg: '校验码不匹配,请确认校验码是否正确' } as Uart.ApolloMongoResult
            // 缓存权限
            ctx.$Event.ClientCache.CacheUserJurisdiction.set(ctx.user as string, ctx.$token)
            return { ok: 1, msg: "校验通过" } as Uart.ApolloMongoResult
        },

        /**
         * 重置用户密码
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async resetUserPasswd(root, { user }, ctx) {
            const User = await Users.findOne({ $or: [{ user }, { mail: user }] }).lean<Uart.UserInfo>()
            if (User) {
                const code = (Math.random() * 10000).toFixed(0)
                ctx.$Event.ClientCache.CacheUserValidationCode.set('reset' + user, code)
                const res = await SendValidation(String(User.tel), code)
                if (res.ok) res.msg = Tool.Mixtel(User.tel)
                return res
            } else {
                return { ok: 0, msg: '账号不存在,请和对账号' } as Uart.ApolloMongoResult
            }
        },

        /**
         * 校验用户验证码
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async resetValidationCode(root, { user, code }, ctx) {
            const codeMap = ctx.$Event.ClientCache.CacheUserValidationCode
            if (codeMap.has('reset' + user)) {
                if (code === codeMap.get('reset' + user)) {
                    const hash = await JwtSign({ user, code })
                    return { ok: 1, msg: hash } as Uart.ApolloMongoResult
                } else {
                    return { ok: 0, msg: '校验码不正确' } as Uart.ApolloMongoResult
                }

            } else {
                return { ok: 0, msg: '没有校验码' } as Uart.ApolloMongoResult
            }
        },

        /**
         * 重置用户密码
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async setUserPasswd(root, { hash, passwd }: { hash: string, passwd: string }, ctx) {
            const { user } = await JwtVerify(hash)
            if (!user) return { ok: 0, msg: 'token出错' } as Uart.ApolloMongoResult
            ctx.$Event.ClientCache.CacheUserValidationCode.delete('reset' + user)
            return await Users.updateOne({ user }, { $set: { passwd: await BcryptDo(passwd) } })
        },

        /**
         * 添加聚合设备
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async addAggregation(root, { name, aggs }: { name: string, aggs: Uart.AggregationDev[] }, ctx) {
            const aggObj: Uart.Aggregation = {
                user: ctx.user as string,
                id: '',
                name,
                aggregations: aggs,
                devs: []
            }
            const agg = await new UserAggregation(aggObj).save()
            const result = await UserAggregation.updateOne({ name, user: ctx.user }, { $set: { id: agg._id } })
            return result
        },

        /**
         * 删除聚合设备
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async deleteAggregation(root, { id }, ctx) {
            const result = await UserAggregation.deleteOne({ user: ctx.user, id })
            return result
        },

        /**
         * 重置设备超时状态
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        refreshDevTimeOut(root, { mac, pid }: { mac: string, pid: string }, ctx) {
            ctx.$Event.ResetTimeOutMonutDev(mac, parseInt(pid))
            return { ok: 1 } as Uart.ApolloMongoResult
        },

        /**
         * 确认用户告警
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async confrimAlarm(root, { id }, ctx) {
            const BindDevs: string[] = getUserBindDev(ctx.user)
            if (id) {
                const doc = await LogUartTerminalDataTransfinite.findById(id, "mac").lean<Uart.uartAlarmObject>()
                if (doc && BindDevs.includes(doc.mac)) {
                    // 确认告警缓存清除
                    const tags = doc.mac + doc.pid + doc.tag
                    return await LogUartTerminalDataTransfinite.findByIdAndUpdate(id, { $set: { isOk: true } }).exec()
                } else return { ok: 0 } as Uart.ApolloMongoResult
            } else {
                return await LogUartTerminalDataTransfinite.updateMany({ mac: { $in: BindDevs } }, { $set: { isOk: true } }).exec()
            }
        },

        /**
         * 发送用户socket信息
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        sendSocketInfo(root, { user, msg }: { user: string, msg: string }, ctx) {
            valadationRoot(ctx)
            ctx.$Event.SendUserSocketInfo(user, msg)
            return { ok: 1 } as Uart.ApolloMongoResult
        },

        /**
         * 删除用户配置
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async deleteUser(root, { user, hash }, ctx) {
            valadationRoot(ctx)
            // 获取删除用户的信息
            const userInfo = await Users.findOne({ user })
            if (!userInfo) {
                return {
                    ok: 0,
                    msg: '没有此用户,删除失败'
                }
            }
            if (userInfo.userGroup === 'root') {
                return {
                    ok: 0,
                    msg: '只能删除用户信息'
                }
            }
            if (hash !== 'lgups@123') {
                return {
                    ok: 0,
                    msg: '独立校验密码错误'
                }
            }
            await UserAggregation.deleteOne({ user }).exec()
            await UserAlarmSetup.deleteOne({ user }).exec()
            await UserBindDevice.deleteOne({ user }).exec()
            return await Users.deleteOne({ user }).exec()

        },

        /**
         * 删除用户配置
         * @param root 
         * @param param1 
         * @param ctx 
         * @returns 
         */
        async deleteUsersetup(root, { user }, ctx) {
            valadationRoot(ctx)
            return await UserAlarmSetup.deleteOne({ user }).exec()
        },

        /**
         * 设备设备别名
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async setAlias(root, arg: { mac: string, pid: string, protocol: string, name: string, alias: string }, ctx) {
            const { mac, pid, protocol, name, alias } = arg
            const data = ctx.$Event.Cache.CacheAlias.get(mac + pid + protocol) //await DevArgumentAlias.findOne({ mac, pid, protocol, 'alias.name': name }).lean<Uart.DevArgumentAlias>()
            let result;
            // $数组操作符需要查询匹配到数组数据，否则会报错误
            if (data && data.has(name)) {
                result = await DevArgumentAlias.updateOne({ mac, pid: Number(pid), protocol, 'alias.name': name }, { $set: { 'alias.$.alias': alias } }, { multi: true })
            } else {
                result = await DevArgumentAlias.updateOne({ mac, pid: Number(pid), protocol }, { $push: { alias: { name, alias } } }, { upsert: true })
            }
            await ctx.$Event.Cache.RefreshCacheAlias({ mac, pid: Number(pid), protocol })
            return result
        },

        /**
         * 设置用户布局配置
         * @param root 
         * @param arg 
         * @param ctx 
         * @returns 
         */
        async setUserLayout(root, arg: { id: string, type: string, bg: string, Layout: Uart.AggregationLayoutNode[] }, ctx) {
            const { id, type, bg, Layout } = arg
            return await UserLayout.updateOne({ id, user: ctx.user }, { $set: { type, bg, Layout } }, { upsert: true }).lean<Uart.userLayout>()
        },

        /**
         * 下载设备协议
         * @param protocol 
         */
        async downProtocol(root, arg: { protocol: string[] }, ctx) {
            const protocols = await DeviceProtocol.find({ Protocol: { $in: arg.protocol } })

            // const stream = fs.createReadStream()
        },

        /**
         * 更新协议
         * @param protocol 
         */
        async updateProtocol(root, arg: { protocol: Uart.protocol }, ctx) {
            const { Protocol, ProtocolType, instruct } = arg.protocol
            const result = await DeviceProtocol.updateOne({ Protocol, ProtocolType }, { $set: { instruct } })
            if (result.ok) {
                ctx.$Event.Cache.RefreshCacheProtocol(Protocol)
            }
            return result

        }
    },

};

export default resolvers

/**
 * 验证普通用户是否是越权操作他人的设备
 * @param ctx 用户对象句柄
 * @param mac 设备mac
 * @returns 
 */
function valadationMac(ctx: ApolloCtx, mac: string) {
    if (validationUserPermission(ctx.user, mac)) return true
    else {
        console.log("user premission Error", ctx.userGroup, ctx.user, mac, ctx.operationName);
        throw new Error("user premission Error");
    }
}

/**
 * 验证普通用户是否是越权
 * @param ctx 
 * @returns 
 */
function valadationRoot(ctx: ApolloCtx) {
    const group = ctx.userGroup!
    const g = new Set(['root', 'admin'])
    if (!g.has(group)) {
        console.log("user premission Error", ctx.userGroup, ctx.user, ctx.operationName);
        throw new Error("user premission Error");
    } else return true
}