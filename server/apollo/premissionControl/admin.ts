import { IResolvers } from "apollo-server-koa";
import _ from "lodash"
import { UserAlarmSetup, LogNodes, LogTerminals, LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserLogins, LogUserRequst, LogUseBytes, Users, NodeClient, DeviceProtocol, DevConstant, DevsType, RegisterTerminal, Terminal, EcTerminal, NodeRunInfo, UserBindDevice, TerminalClientResult, TerminalClientResults, TerminalClientResultSingle } from "../../mongoose";
import Tool from "../../util/tool";
import { getUserBindDev } from "../../util/util";
import * as Cron from "../../cron/index";
import { Uart } from "typing";

const resolvers: IResolvers<undefined, Uart.ApolloCtx> = {
    Query: {
        // 获取用户自定义配置
        async getUserSetups() {
            return await UserAlarmSetup.find()
        },

        // 获取socket node状态
        getSocketNode(root, arg, ctx) {
            const TimeOutMonutDevs = Array.from(ctx.$Event.Cache.TimeOutMonutDev) as string[]
            return Array.from(ctx.$Event.Cache.CacheNodeTerminalOnline).map(el => {
                const reg = new RegExp("^" + el)
                const ter = ctx.$Event.Cache.CacheTerminal.get(el) as Uart.Terminal
                const temp = TimeOutMonutDevs.filter(el2 => reg.test(el2))
                const TimeOutMonutDev = ter.mountDevs.filter(els => temp.includes(ter.DevMac + els.pid))
                return {
                    terminal: el,
                    name: ter.name,
                    TimeOutMonutDev
                }
            })
        },
        // 获取socket user状态
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
        // 获取节点日志
        async lognodes(root, { start, end }: { start: Date, end: Date }) {
            return await LogNodes.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取终端日志
        async logterminals(root, { start, end }: { start: Date, end: Date }) {
            return await LogTerminals.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取终端日志
        async userlogterminals(root, { start, end, mac }: { start: Date, end: Date, mac: string }, ctx) {
            const UserBindDevice = ctx.$Event.Cache.CacheBind.get(ctx.user)?.UTs as string[]
            if (!UserBindDevice || (mac && !UserBindDevice.includes(mac))) return null
            const types = ['连接', '断开']
            return await LogTerminals.find({ TerminalMac: mac, type: { $in: types } }).where("createdAt").gte(start).lte(end).exec()
        },
        // 获取短信日志
        async logsmssends(root, { start, end }: { start: Date, end: Date }) {
            return await LogSmsSend.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取邮件日志
        async logmailsends(root, { start, end }: { start: Date, end: Date }) {
            return await LogMailSend.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取设备告警日志
        async loguartterminaldatatransfinites(root, { start, end }: { start: Date, end: Date }, ctx) {
            const query = LogUartTerminalDataTransfinite.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
            // 如果未清洗的数据查询结果的大于N条,则先清洗数据
            if (await query.countDocuments() > 2000) {
                const cur = query.cursor()
                await Cron.Uartterminaldatatransfinites(cur)
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
        // 获取用户登陆日志
        async loguserlogins(root, { start, end }: { start: Date, end: Date }) {
            return await LogUserLogins.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取用户请求日志
        async loguserrequsts(root, { start, end }: { start: Date, end: Date }) {
            const query = LogUserRequst.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
            // 如果未清洗的数据查询结果的大于N条,则先清洗数据
            if (await query.countDocuments() > 2000) {
                const cur = query.cursor()
                await Cron.CleanUserRequst(cur)
            }
            return await LogUserRequst.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取设备使用流量
        async logterminaluseBtyes(root, { mac }, ctx) {
            return await LogUseBytes.find({ mac }).exec()
        },

        // 获取后台运行状态
        async runingState(root, arg, ctx) {
            if (ctx.userGroup === 'root') {
                const Event = ctx.$Event
                const Cache = Event.Cache
                const CacheClient = Event.ClientCache
                // 在线用户
                const User = {
                    online: CacheClient.CacheSocketidUser.size - 1,
                    all: await Users.countDocuments().exec()
                }
                // 在线节点
                const Node = {
                    online: Event.uartSocket?.CacheSocket.size || 0,
                    all: Cache.CacheNode.size
                }
                // 在线终端
                const Terminal = {
                    online: Cache.CacheNodeTerminalOnline.size,
                    all: Cache.CacheTerminal.size
                }
                // 所以协议
                const Protocol = Cache.CacheProtocol.size
                // 超时设备数量
                const TimeOutMonutDev = Cache.TimeOutMonutDev.size
                // 系统事件总数
                const events = Event.eventNames()
                // 系统性能
                const SysInfo = Tool.NodeInfo()
                return { User, Node, Terminal, Protocol, TimeOutMonutDev, events, SysInfo }
            }
            else return null
        },
        // 节点状态
        async Node(root, { IP, Name }, ctx) {

            return await NodeClient.findOne({
                $or: [{ IP: IP || "" }, { Name: Name || "" }]
            });
        },
        async Nodes(root, arg, ctx) {
            return ctx.$Event.Cache.CacheNode.values();
        },
        // 协议
        async Protocol(root, { Protocol }) {
            return await DeviceProtocol.findOne({ Protocol });
        },
        async Protocols() {
            return await DeviceProtocol.find();
        },
        // 获取协议常量
        async getDevConstant(root, { Protocol }) {
            return await DevConstant.findOne({ Protocol })
        },
        // 设备类型
        async DevType(root, { DevModel }) {
            return await DevsType.findOne({ DevModel });
        },
        async DevTypes(root, { Type }, ctx) {
            const Types = Type ? { Type } : {}
            return await DevsType.find(Types);
        },
        //查询注册终端设备的节点
        async RegisterTerminal(root, { DevMac }) {
            return await RegisterTerminal.findOne({ DevMac })
        },
        // 查询节点所属终端
        async RegisterTerminals(root, { NodeName }) {
            return await RegisterTerminal.find({ mountNode: NodeName })
        },

        // 检索在线的终端
        async TerminalOnline(root, { DevMac }, ctx) {
            const terminals = await Terminal.findOne({ DevMac }).lean() as Uart.Terminal
            if (!terminals) return null
            if (ctx.$Event.Cache.CacheNodeTerminalOnline.has(DevMac)) return terminals
            else return null
            //return await Terminal.findOne({ DevMac });
        },
        async Terminals(root, arg, ctx) {
            const terminals = [...ctx.$Event.Cache.CacheTerminal.values()]
            return terminals.map(el => {
                el.online = ctx.$Event.Cache.CacheNodeTerminalOnline.has(el.DevMac)
                return el
            })
        },
        // 环控终端信息
        async ECterminal(root, { ECid }) {
            return await EcTerminal.findOne({ ECid });
        },
        async EcTerminals() {
            return await EcTerminal.find({});
        },
        // 节点信息
        async NodeInfo(root, { NodeName }) {
            return await NodeRunInfo.find(NodeName ? { NodeName } : {});
        },
        // 用户
        async User(root, { user }, ctx) {
            return await Users.findOne({ user: ctx.user });
        },
        async Users() {
            return await Users.find();
        },

        async BindDevices() {
            return await UserBindDevice.find({}).lean();
        },
    },


    Mutation: {

        // 设置节点
        async setNode(root, { arg }, ctx) {
            const { Name, IP, Port, MaxConnections } = JSON.parse(arg);
            const result = await NodeClient.updateOne(
                { IP },
                { $set: { Name, Port, MaxConnections } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheNode();
            return result;
        },
        // 删除节点
        async deleteNode(root, { IP }, ctx) {
            const result = await NodeClient.deleteOne({ IP });
            await ctx.$Event.Cache.RefreshCacheNode();
            return result;
        },
        // 设置协议
        async setProtocol(root, { arg }, ctx) {
            const { Type, ProtocolType, Protocol, instruct } = arg;
            const result = await DeviceProtocol.updateOne(
                { Type, Protocol },
                { $set: { ProtocolType, instruct } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheProtocol(Protocol);
            return result;
        },
        // 删除协议
        async deleteProtocol(root, { Protocol }, ctx) {
            const result = await DeviceProtocol.deleteOne({ Protocol });
            ctx.$Event.Cache.CacheProtocol.delete(Protocol)
            return result;
        },
        // 添加设备类型
        async addDevType(root, { arg }, ctx) {
            const { Type, DevModel, Protocols } = arg;
            const result = await DevsType.updateOne(
                { Type, DevModel },
                { $set: { Protocols } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheDevType(DevModel);
            return result;
        },
        // 添加设备类型
        async deleteDevModel(root, { DevModel }, ctx) {
            const result = await DevsType.deleteOne({ DevModel });
            ctx.$Event.Cache.CacheDevsType.delete(DevModel)
            return result;
        },
        // 添加登记设备
        async addRegisterTerminal(root, { DevMac, mountNode }, ctx) {
            await new RegisterTerminal({ DevMac, mountNode }).save()
            const result = await Terminal.updateOne(
                { DevMac },
                { $set: { mountNode, name: DevMac } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },
        // 删除登记设备 
        async deleteRegisterTerminal(root, { DevMac }, ctx) {
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
        // 添加终端信息
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
        // 修改终端
        async modifyTerminal(root, { DevMac, arg }, ctx) {
            const result = await Terminal.updateOne(
                { DevMac },
                { $set: arg },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },
        // 删除终端信息
        async deleteTerminal(root, { DevMac }, ctx) {
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

        // 添加终端挂载信息
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
        // 删除终端挂载设备
        async delTerminalMountDev(root, { DevMac, mountDev, pid }, ctx) {
            const result = await Terminal.updateOne({ DevMac }, { $pull: { mountDevs: { mountDev, pid } } })
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
            return result
        },
        // 修改终端挂载设备
        async modifyTerminalMountDev(root, { DevMac, pid, arg }, ctx) {
            const result = await Terminal.updateOne({ DevMac, 'mountDevs.pid': pid }, { $set: { "mountDevs.$": arg } })
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
            return result
        },

        // 添加设备协议常量配置
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
            let Up
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

        // 发送用户socket信息
        sendSocketInfo(root, { user, msg }: { user: string, msg: string }, ctx) {
            ctx.$Event.SendUserSocketInfo(user, msg)
            return { ok: 1 } as Uart.ApolloMongoResult
        },
        // 删除用户配置
        async deleteUsersetup(root, { user }, ctx) {
            return await UserAlarmSetup.deleteOne({ user }).exec()
        }
    }
};

export default resolvers