import { IResolvers } from "apollo-server-koa";

import { NodeClient, NodeRunInfo, TerminalClientResultSingle, TerminalClientResult, TerminalClientResults } from "../mongoose/node";

import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";

import { Terminal, RegisterTerminal } from "../mongoose/Terminal";

import { EcTerminal } from "../mongoose/EnvironmentalControl";

import { Users, UserBindDevice, UserAlarmSetup, UserAggregation } from "../mongoose/user";

import { queryResult, queryResultArgument, DevConstant_Air, DevConstant_Ups, DevConstant_EM, DevConstant_TH, BindDevice, ApolloCtx, Threshold, ConstantThresholdType, queryResultSave, TerminalMountDevs, protocol, protocolInstruct, instructQuery, instructQueryArg, OprateInstruct, userSetup, UserInfo, logUserRequst, logUserLogins, ApolloMongoResult, Terminal as terminal, Aggregation, AggregationDev } from "../bin/interface";

import { BcryptDo } from "../util/bcrypt";

import { DevConstant } from "../mongoose/DeviceParameterConstant";

import _ from "lodash"
import { LogUserLogins, LogTerminals, LogNodes, LogSmsSend, LogUartTerminalDataTransfinite, LogUserRequst } from "../mongoose/Log";
import { SendValidation } from "../util/SMS";
import Tool from "../util/tool";
import { JwtSign, JwtVerify } from "../util/Secret";
import * as Cron from "../cron/index";

const resolvers: IResolvers = {
    Query: {
        // 节点状态
        async Node(root, { IP, Name }, ctx: ApolloCtx) {

            return await NodeClient.findOne({
                $or: [{ IP: IP || "" }, { Name: Name || "" }]
            });
        },
        async Nodes(root, arg, ctx: ApolloCtx) {
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
        // 终端信息
        async Terminal(root, { DevMac }) {
            return await Terminal.findOne({ DevMac });
        },
        // 检索在线的终端
        async TerminalOnline(root, { DevMac }, ctx: ApolloCtx) {
            const terminal = await Terminal.findOne({ DevMac }).lean() as terminal
            if (!terminal) return null
            const NodeIP = ctx.$Event.Cache.CacheNodeName.get(terminal.mountNode)?.IP as string
            console.log({ terminal, aa: ctx.$Event.Cache.CacheNodeTerminalOnline, NodeIP });

            if (ctx.$Event.Cache.CacheNodeTerminalOnline.get(NodeIP)?.has(DevMac)) return terminal
            else return null
            //return await Terminal.findOne({ DevMac });
        },
        async Terminals() {
            return await Terminal.find();
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
        async User(root, { user }, ctx: ApolloCtx) {
            return await Users.findOne({ user: ctx.user });
        },
        async Users() {
            return await Users.find();
        },
        // 绑定设备信息
        async BindDevice(root, arg, ctx: ApolloCtx) {
            const Bind: any = await UserBindDevice.findOne({ user: ctx.user }).lean();
            if (!Bind) return null;
            Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } }).lean();
            Bind.ECs = await EcTerminal.find({ ECid: { $in: Bind.ECs } }).lean();
            Bind.AGG = await UserAggregation.find({user:ctx.user})
            //
            Bind.UTs = Bind.UTs.map((el: any) => {
                const nodeIP = ctx.$Event.Cache.CacheNodeName.get(el.mountNode)?.IP as string
                const macMap = ctx.$Event.Cache.CacheNodeTerminalOnline.get(nodeIP)
                el.online = macMap?.has(el.DevMac) || false
                return el
            })
            return Bind;
        },
        async BindDevices() {
            const Bind: BindDevice[] | null = await UserBindDevice.find({}).lean();
            if (Bind?.length === 0) return [];
            Bind.forEach(async (el) => {
                el.UTs = await Terminal.find({ DevMac: { $in: el.UTs } }).lean();
            });
            // Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } });
            return await Bind;
        },
        // 获取用户组
        userGroup(root, arg, ctx: ApolloCtx) {
            return ctx.userGroup;
        },
        // 获取透传设备数据-单条
        async UartTerminalData(root, { DevMac, pid }, ctx: ApolloCtx) {
            // 获取mac协议
            const protocol = ctx.$Event.Cache.CacheTerminal.get(DevMac)?.mountDevs.find(el => el.pid === pid)?.protocol as string
            // 获取配置显示常量参数
            const ShowTag = ctx.$Event.Cache.CacheConstant.get(protocol)?.ShowTag as string[]
            const data = await TerminalClientResultSingle.findOne({
                mac: DevMac,
                pid
            }).lean<queryResult>() as queryResult
            /* const data = await TerminalClientResultSingle.aggregate().match({ mac: DevMac, pid }).unwind('result').match({ 'result.name': { '$in': ShowTag } })
                .group({
                    _id: "$_id", result: { '$push': "$result" }
                }).limit(1)
            console.log(data); */

            // 刷选
            data.result = ShowTag ? (data.result?.filter(el => ShowTag?.includes(el.name))) : data.result
            return data
        },
        // 获取透传设备数据-多条
        async UartTerminalDatas(root, { DevMac, name, pid, datatime }) {
            let result: queryResultSave[]
            // 如果没有日期参数,默认检索最新的100条数据
            if (datatime === "") {
                result = await TerminalClientResult.find({ mac: DevMac, pid, "result.name": name }, { "result.$": 1, timeStamp: 1 })
                    .sort("-timeStamp")
                    .limit(100).lean() as any;
            } else {
                const start = new Date(datatime);
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
            return resultChunk.map(el => {
                // 刷选切块,如果值相同则抛弃
                let def: queryResultSave = el[0]
                //def.result = [def.result.find(el2 => el2.name === name) as queryResultArgument]
                return el.reduce((pre, cur) => {
                    // 获取最后一个值
                    const last = _.last(pre) as queryResultSave
                    //cur.result = [cur.result.find(el2 => el2.name === name) as queryResultArgument]
                    if (cur.result[0] && last.result[0].value !== cur.result[0].value) pre.push(cur)
                    return pre
                }, [def])
            }).flat()
        },
        // 获取设备在线状态
        getDevState(root, { mac, node }, ctx: ApolloCtx) {
            if (!mac || !node) return false
            const nodeIP = ctx.$Event.Cache.CacheNodeName.get(node)?.IP as string
            const macMap = ctx.$Event.Cache.CacheNodeTerminalOnline.get(nodeIP)
            // console.log({mac,macMap});
            return macMap?.has(mac) || false
        },
        // 获取用户自定义配置
        async getUserSetup(root, arg, ctx: ApolloCtx) {
            return await UserAlarmSetup.findOne({ user: ctx.user })
        },
        // 获取用户自定义配置
        async getUserSetups() {
            return await UserAlarmSetup.find()
        },
        // 获取协议常量
        async getUserDevConstant(root, { Protocol }, ctx: ApolloCtx) {
            const userSetup = ctx.$Event.Cache.CacheUserSetup.get(ctx.user as string) as userSetup
            const res = userSetup.ProtocolSetupMap.get(Protocol)
            // const res = await UserAlarmSetup.findOne({ user: ctx.user,"ProtocolSetup.Protocol":Protocol },{"ProtocolSetup.Protocol":1,user:1})
            // console.log({ userSetup, res });
            return res
        },
        // 获取用户设备日志
        async getLogTerminal(root, arg, ctx: ApolloCtx) {
            //获取用户绑定设备列表
            const BindDevs: string[] = []
            ctx.$Event.Cache.CacheBindUart.forEach((val, key) => {
                if (val === ctx.user) BindDevs.push(key)
            })
            // 
            const result = await LogTerminals.find({ TerminalMac: { $in: BindDevs } })
            return result
        },
        // 获取用户tel
        async getUserTel(root, arg, ctx: ApolloCtx) {
            const user = await Users.findOne({ user: ctx.user }).lean<UserInfo>() as UserInfo
            const tel = Tool.Mixtel(user.tel)
            return tel
        },
        // 获取socket node状态
        getSocketNode(root, arg, ctx: ApolloCtx) {
            return Array.from(ctx.$Event.Cache.CacheNodeTerminalOnline.entries()).map(el => {
                const timeOutOprate = Array.from(ctx.$Event.Cache.CacheTerminalQueryIntructTimeout.get(el[0]) || [])
                return { node: el[0], set: Array.from(el[1]), timeOutOprate }
            })
        },
        // 获取socket user状态
        getUserNode(root, arg, ctx: ApolloCtx) {
            return Array.from(ctx.$Event.ClientCache.CacheUserSocketids.entries()).map(el => ({ user: el[0], set: Array.from(el[1]) }))
        },
        // 获取节点日志
        async lognodes(root, { start, end }: { start: Date, end: Date }) {
            return await LogNodes.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取终端日志
        async logterminals(root, { start, end }: { start: Date, end: Date }) {
            return await LogTerminals.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取短信日志
        async logsmssends(root, { start, end }: { start: Date, end: Date }) {
            return await LogSmsSend.find().where("createdAt").gte(start).lte(end).exec()
        },
        // 获取邮件日志
        async logmailsends(root, { start, end }: { start: Date, end: Date }) {
            return []
        },
        // 获取设备告警日志
        async loguartterminaldatatransfinites(root, { start, end }: { start: Date, end: Date }, ctx: ApolloCtx) {
            const query = LogUartTerminalDataTransfinite.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
            // 如果未清洗的数据查询结果的大于N条,则先清洗数据
            if (await query.countDocuments() > 2000) {
                const cur = query.cursor()
                await Cron.Uartterminaldatatransfinites(cur)
            }
            if (ctx.userGroup === "user") {
                //获取用户绑定设备列表
                const BindDevs: string[] = []
                ctx.$Event.Cache.CacheBindUart.forEach((val, key) => {
                    if (val === ctx.user) BindDevs.push(key)
                })
                const result = await LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).where("createdAt").gte(start).lte(end).lean()
                return result.reverse()
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
    },

    /* 
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    */
    Mutation: {
        // 设置节点
        async setNode(root, { arg }, ctx: ApolloCtx) {
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
        async deleteNode(root, { IP }, ctx: ApolloCtx) {
            const result = await NodeClient.deleteOne({ IP });
            await ctx.$Event.Cache.RefreshCacheNode();
            return result;
        },
        // 设置协议
        async setProtocol(root, { arg }, ctx: ApolloCtx) {
            const { Type, ProtocolType, Protocol, instruct } = arg;
            const result = await DeviceProtocol.updateOne(
                { Type, Protocol },
                { $set: { ProtocolType, instruct } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheProtocol();
            return result;
        },
        // 删除协议
        async deleteProtocol(root, { Protocol }, ctx: ApolloCtx) {
            const result = await DeviceProtocol.deleteOne({ Protocol });
            await ctx.$Event.Cache.RefreshCacheProtocol();
            return result;
        },
        // 添加设备类型
        async addDevType(root, { arg }, ctx: ApolloCtx) {
            const { Type, DevModel, Protocols } = arg;
            const result = await DevsType.updateOne(
                { Type, DevModel },
                { $set: { Protocols } },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheDevType();
            return result;
        },
        // 添加设备类型
        async deleteDevModel(root, { DevModel }, ctx: ApolloCtx) {
            const result = await DevsType.deleteOne({ DevModel });
            await ctx.$Event.Cache.RefreshCacheDevType();
            return result;
        },
        // 添加登记设备
        async addRegisterTerminal(root, { DevMac, mountNode }, ctx: ApolloCtx) {
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
        async deleteRegisterTerminal(root, { DevMac }) {
            // 如果没有被绑定则删除
            const terminal = await UserBindDevice.findOne({ "UTS": DevMac })
            if (terminal) {
                return { ok: 0, msg: "设备已被用户绑定" }
            } else {
                await TerminalClientResult.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResults.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResultSingle.deleteMany({ mac: DevMac }).exec()
                await Terminal.deleteOne({ DevMac }).exec()
                const result = await RegisterTerminal.deleteOne({ DevMac })
                //await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
                return result
            }
        },
        // 添加终端信息
        async addTerminal(root, { arg }, ctx: ApolloCtx) {
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
        async modifyTerminal(root, { DevMac, arg }, ctx: ApolloCtx) {
            const result = await Terminal.updateOne(
                { DevMac },
                { $set: arg },
                { upsert: true }
            );
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result;
        },
        // 删除终端信息
        async deleteTerminal(root, { DevMac }, ctx: ApolloCtx) {
            /* const result = await Terminal.deleteOne({ DevMac });
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
            return result; */
            // 如果没有被绑定则删除
            const terminal = await UserBindDevice.findOne({ "UTS": DevMac })
            if (terminal) {
                return { ok: 0, msg: "设备已被用户绑定" }
            } else {
                await TerminalClientResult.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResults.deleteMany({ mac: DevMac }).exec()
                await TerminalClientResultSingle.deleteMany({ mac: DevMac }).exec()
                await Terminal.deleteOne({ DevMac }).exec()
                const result = await RegisterTerminal.deleteOne({ DevMac })
                await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
                return result
            }
        },
        // 添加终端挂载信息
        async addTerminalMountDev(root, { arg }, ctx: ApolloCtx) {
            console.log(arg);

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
        async delTerminalMountDev(root, { DevMac, mountDev, pid }, ctx: ApolloCtx) {
            const result = await Terminal.updateOne({ DevMac }, { $pull: { mountDevs: { mountDev, pid } } })
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
            return result
        },
        // 修改终端挂载设备
        async modifyTerminalMountDev(root, { DevMac, pid, arg }, ctx: ApolloCtx) {
            const result = await Terminal.updateOne({ DevMac, 'mountDevs.pid': pid }, { $set: { "mountDevs.$": arg } })
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
            return result
        },
        // 添加用户
        async addUser(root, { arg }) {
            const userStat = await Users.findOne({ user: arg.user });
            if (userStat) return { ok: 0, msg: "账号有重复,请重新编写账号" };
            const user = Object.assign(arg, { passwd: await BcryptDo(arg.passwd) }) as UserInfo
            const User = new Users(user);
            return await User.save()
                .then(() => {
                    // 生成用户新的自定义配置
                    const setup: Partial<userSetup> = {
                        user: user.user,
                        tels: user.tel ? [String(user.tel)] : [],
                        mails: user.mail ? [user.mail] : []
                    }
                    new UserAlarmSetup(setup).save()
                    // 添加日志记录
                    new LogUserLogins({ user: user.user, type: '用户注册' } as logUserLogins).save()
                    return { ok: 1, msg: "账号注册成功" };
                })
                .catch((e) => console.log(e));
        },
        //
        async modifyUserInfo(root, { arg }, ctx: ApolloCtx) {
            const keys = Object.keys(arg)
            if (keys.includes('user')) return { ok: 0, msg: '不能修改用户名' } as ApolloMongoResult
            if (keys.includes('userGroup') && ctx.userGroup !== 'root') return { ok: 0, msg: '权限校验失败' } as ApolloMongoResult
            if (keys.some(el => arg[el].length > 50)) return { ok: 0, msg: '参数值过长' } as ApolloMongoResult
            return await Users.updateOne({ user: ctx.user }, { $set: arg })
        },
        // 添加用户绑定终端
        async addUserTerminal(root, { type, id }, ctx: { user: any }) {
            switch (type) {
                case "UT":
                    {
                        const isBind = await UserBindDevice.findOne({ UTs: id }).exec()
                        if (isBind) {
                            return { ok: 0, msg: `${id}设备已被绑定` } as ApolloMongoResult
                        } else
                            return await UserBindDevice.updateOne(
                                { user: ctx.user },
                                { $addToSet: { UTs: id } },
                                { upsert: true }
                            );
                    }
                case "EC":
                    {
                        const isBind = await UserBindDevice.findOne({ "ECS": id })
                        if (isBind) {
                            return { ok: 0, msg: `${id}设备已被绑定` } as ApolloMongoResult
                        } else
                            return await UserBindDevice.updateOne(
                                { user: ctx.user },
                                { $addToSet: { ECs: id } },
                                { upsert: true }
                            );
                    }
            }
        },
        // 添加用户绑定终端
        async delUserTerminal(root, { type, id }, ctx: { user: any }) {
            switch (type) {
                case "UT":
                    {
                        return await UserBindDevice.updateOne(
                            { user: ctx.user },
                            { $pull: { UTs: id } },
                            { upsert: true }
                        );
                    }
                case "EC":
                    {
                        return await UserBindDevice.updateOne(
                            { user: ctx.user },
                            { $pull: { ECs: id } },
                            { upsert: true }
                        );
                    }
            }
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
                type: ConstantThresholdType
                arg:
                | DevConstant_Air
                | DevConstant_Ups
                | DevConstant_EM
                | DevConstant_TH
                | string[]
                | OprateInstruct

            }, ctx: ApolloCtx
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
                case "Oprate":
                    Up = { OprateInstruct: arg }
                    break
            }
            const result = await DevConstant.updateOne(
                { Protocol, ProtocolType },
                { $set: Up },
                { upsert: true }
            )
            ctx.$Event.Cache.RefreshCacheConstant()
            return result;
        },
        /* // 发送设备协议指令
        async SendProcotolInstruct(root, { arg, value }: { arg: instructQueryArg, value: number[] }, ctx: ApolloCtx) {
            // 获取协议指令
            const protocol = ctx.$Event.Cache.CacheProtocol.get(arg.protocol) as protocol
            // 获取条协议指令开始位置
            const instruct = protocol.instruct.find(el => el.resize.split('\n').some(el2 => el2.includes(arg.name) && el2.includes(arg.unit as string))) as protocolInstruct

            // 查询指=指令
            const instructstart = parseInt(instruct.name.slice(4, 6))
            // 获取参数在字符的位置
            const instructlen = parseInt(instruct.formResize.find(el => el.name === arg.name)?.regx?.split('-')[0] as string)
            // 参数在寄存器实际的位置
            const add = instructstart + instructlen === 1 ? instructlen : (instructlen + 1) / 2
            // 拼接为数组
            const instructArr = [5, 0, add, ...value]
            // 携带事件名称，触发指令查询
            const Query: instructQuery = {
                DevMac: arg.DevMac,
                pid: arg.pid,
                type: protocol.Type,
                events: 'oprate' + Date.now() + arg.DevMac,
                content: Buffer.from(instructArr).toString('hex')
            }
            const result = await ctx.$SocketUart.InstructQuery(Query)
            return result
        }, */
        //  固定发送设备操作指令
        async SendProcotolInstructSet(root, { query, item }: { query: instructQueryArg, item: OprateInstruct }, ctx: ApolloCtx) {
            // 验证客户是否校验过权限
            const juri = ctx.$Event.ClientCache.CacheUserJurisdiction.get(ctx.user as string)
            if (!juri || juri !== ctx.$token) {
                // return { ok: 4, msg: "权限校验失败,请校验身份" } as ApolloMongoResult
            }
            // 获取协议指令
            const protocol = ctx.$Event.Cache.CacheProtocol.get(query.protocol) as protocol
            // 检查操作指令是否含有自定义参数
            if (/(%i)/.test(item.value)) {
                // 如果是海信协议
                if (/(^HX.*)/.test(query.protocol)) {
                    const b = Buffer.allocUnsafe(2)
                    b.writeInt16BE((item.val as number + 20) * 2)
                    item.value = item.value.replace(/(%i)/, b.slice(1, 2).toString("hex"))
                } else {
                    const b = Buffer.allocUnsafe(2)
                    b.writeIntBE(item.val as number * item.bl, 0, 2)
                    item.value = item.value.replace(/(%i)/, b.toString("hex"))
                }
            }
            // 携带事件名称，触发指令查询
            const Query: instructQuery = {
                protocol: query.protocol,
                DevMac: query.DevMac,
                pid: query.pid,
                type: protocol.Type,
                events: 'oprate' + Date.now() + query.DevMac,
                content: item.value
            }
            const result = await ctx.$SocketUart.InstructQuery(Query)
            return result
        },
        // 设置用户自定义设置(联系方式)
        async setUserSetupContact(root, { tels, mails }: { tels: string[], mails: string[] }, ctx: ApolloCtx) {
            const result = await UserAlarmSetup.updateOne({ user: ctx.user }, { $set: { tels: tels || [ctx.tel], mails: mails || [ctx.mail] } }, { upsert: true })
            ctx.$Event.Cache.RefreshCacheUserSetup()
            return result
        },
        // 设置用户自定义设置(协议配置)
        async setUserSetupProtocol(root, {
            ProtocolType,
            Protocol,
            type,
            arg
        }: {
            ProtocolType: string;
            Protocol: string;
            type: ConstantThresholdType
            arg:
            | DevConstant_Air
            | DevConstant_Ups
            | DevConstant_EM
            | DevConstant_TH
            | string[]
            | OprateInstruct

        }, ctx: ApolloCtx
        ) {
            let Up
            switch (type) {
                case "Constant":
                    Up = { "ProtocolSetup.$.Constant": arg }
                    break
                case "Threshold":
                    Up = { "ProtocolSetup.$.Threshold": arg }
                    break
                case "ShowTag":
                    Up = { "ProtocolSetup.$.ShowTag": _.compact(arg as string[]) }
                    break
                case "Oprate":
                    Up = { OprateInstruct: arg }
                    break
            }
            const isNull = await UserAlarmSetup.findOne({ user: ctx.user, "ProtocolSetup.Protocol": Protocol }).exec()
            if (!isNull) {
                await UserAlarmSetup.updateOne({ user: ctx.user }, { $set: { ProtocolSetup: { Protocol } } }).exec()
            }
            console.log({ isNull, user: ctx.user });

            const result = await UserAlarmSetup.updateOne(
                { user: ctx.user, "ProtocolSetup.Protocol": Protocol },
                { $set: Up },
                { upsert: true }
            )
            ctx.$Event.Cache.RefreshCacheUserSetup()
            return result;
        },
        // 发送验证码
        async sendValidationSms(root, arg, ctx: ApolloCtx) {
            const user = await Users.findOne({ user: ctx.user }).lean<UserInfo>() as UserInfo
            const code = (Math.random() * 10000).toFixed(0)
            ctx.$Event.ClientCache.CacheUserValidationCode.set(ctx.$token, code)
            return await SendValidation(String(user.tel), code)
        },
        // 校验验证码,校验通过缓存授权
        ValidationCode(root, { code }, ctx: ApolloCtx) {
            const userCode = ctx.$Event.ClientCache.CacheUserValidationCode.get(ctx.$token)
            if (!userCode || !code) return { ok: 0, msg: '校验码不存在,请重新发送校验码' } as ApolloMongoResult
            if (userCode !== code) return { ok: 0, msg: '校验码不匹配,请确认校验码是否正确' } as ApolloMongoResult
            // 缓存权限
            ctx.$Event.ClientCache.CacheUserJurisdiction.set(ctx.user as string, ctx.$token)
            return { ok: 1, msg: "校验通过" } as ApolloMongoResult
        },
        // 重置用户密码
        async resetUserPasswd(root, { user }, ctx: ApolloCtx) {
            const User = await Users.findOne({ $or: [{ user }, { mail: user }] }).lean<UserInfo>()
            if (User) {
                const code = (Math.random() * 10000).toFixed(0)
                ctx.$Event.ClientCache.CacheUserValidationCode.set('reset' + user, code)
                const res = await SendValidation(String(User.tel), code)
                if (res.ok) res.msg = Tool.Mixtel(User.tel)
                return res
            } else {
                return { ok: 0, msg: '账号不存在,请和对账号' } as ApolloMongoResult
            }
        },
        //校验用户验证码
        async resetValidationCode(root, { user, code }, ctx: ApolloCtx) {
            const codeMap = ctx.$Event.ClientCache.CacheUserValidationCode
            if (codeMap.has('reset' + user)) {
                if (code === codeMap.get('reset' + user)) {
                    const hash = await JwtSign({ user, code })
                    return { ok: 1, msg: hash } as ApolloMongoResult
                } else {
                    return { ok: 0, msg: '校验码不正确' } as ApolloMongoResult
                }

            } else {
                return { ok: 0, msg: '没有校验码' } as ApolloMongoResult
            }
        },
        // 重置用户密码
        async setUserPasswd(root, { hash, passwd }: { hash: string, passwd: string }, ctx: ApolloCtx) {
            const { user } = await JwtVerify(hash)
            if (!user) return { ok: 0, msg: 'token出错' } as ApolloMongoResult
            ctx.$Event.ClientCache.CacheUserValidationCode.delete('reset' + user)
            return await Users.updateOne({ user }, { $set: { passwd: await BcryptDo(passwd) } })
        },
        // 添加聚合设备
        async addAggregation(root, { name, aggs }: { name: string, aggs: AggregationDev[] }, ctx: ApolloCtx) {
            const aggObj:Aggregation = {
                user:ctx.user as string,
                id:'',
                name,
                aggregations:aggs
            }
            const agg = await new UserAggregation(aggObj).save()
            const result = await UserAggregation.updateOne({name,user:ctx.user},{$set:{id:agg._id}})
            return result       
        }
    },

};

export default resolvers 