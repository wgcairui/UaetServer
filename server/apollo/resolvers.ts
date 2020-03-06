import { IResolvers } from "apollo-server-koa";

import { NodeClient, NodeRunInfo, TerminalClientResultSingle, TerminalClientResult } from "../mongoose/node";

import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";

import { Terminal, RegisterTerminal } from "../mongoose/Terminal";

import { EcTerminal } from "../mongoose/EnvironmentalControl";

import { Users, UserBindDevice } from "../mongoose/user";

import { queryResult, queryResultArgument, DevConstant_Air, DevConstant_Ups, DevConstant_EM, DevConstant_TH, BindDevice, ApolloCtx, Threshold, ConstantThresholdType } from "../bin/interface";

import { BcryptDo } from "../bin/bcrypt";

import { DevConstant } from "../mongoose/DeviceParameterConstant";

const resolvers: IResolvers = {
    Query: {
        // 节点状态
        async Node(root, { IP, Name }) {
            return await NodeClient.findOne({
                $or: [{ IP: IP || "" }, { Name: Name || "" }]
            });
        },
        async Nodes() {
            return await NodeClient.find();
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
        async User(root, { user }, ctx) {
            return await Users.findOne({ user });
        },
        async Users() {
            return await Users.find();
        },
        // 绑定设备信息
        async BindDevice(root, arg, ctx: { user: any }) {
            const Bind: BindDevice | null = await UserBindDevice.findOne({ user: ctx.user }).lean();
            if (!Bind) return null;
            Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } }).lean();
            Bind.ECs = await EcTerminal.find({ ECid: { $in: Bind.ECs } }).lean();
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
        async UartTerminalData(root, { DevMac, pid }) {
            const data: queryResult[] = await TerminalClientResultSingle.find({
                mac: DevMac,
                pid
            }).lean();
            if (data.length < 2) return data[0];
            let result: queryResultArgument[][] = [];
            data.forEach(el => result.push(el.result as queryResultArgument[]));
            let rs = data[0];
            rs.result = result.flat();
            return rs;
        },
        // 获取透传设备数据-多条
        async UartTerminalDatas(root, { DevMac, pid, datatime }) {
            let a = null;
            if (datatime === "") {
                a = await TerminalClientResult.find({ mac: DevMac, pid })
                    .sort("timeStamp")
                    .limit(100);
            } else {
                const start = new Date(datatime);
                const end = new Date(datatime + " 23:59:59");
                a = await TerminalClientResult.find({ mac: DevMac, pid })
                    .where("timeStamp")
                    .gte(start.getTime())
                    .lte(end.getTime())
                    .exec();
            }
            return a;
        }
        //
    },

    Mutation: {
        // 设置节点
        async setNode(
            root,
            { arg },
            ctx: { $Event: { Query: { RefreshCacheNode: () => void } } }
        ) {
            const { Name, IP, Port, MaxConnections } = JSON.parse(arg);
            const result = await NodeClient.updateOne(
                { IP },
                { $set: { Name, Port, MaxConnections } },
                { upsert: true }
            );
            await ctx.$Event.Query.RefreshCacheNode();
            return result;
        },
        // 删除节点
        async deleteNode(
            root,
            { IP },
            ctx: { $Event: { Query: { RefreshCacheNode: () => void } } }
        ) {
            const result = await NodeClient.deleteOne({ IP });
            await ctx.$Event.Query.RefreshCacheNode();
            return result;
        },
        // 设置协议
        async setProtocol(
            root,
            { arg },
            ctx: { $Event: { Query: { RefreshCacheProtocol: () => void } } }
        ) {
            const { Type, ProtocolType, Protocol, instruct } = arg;
            const result = await DeviceProtocol.updateOne(
                { Type, Protocol },
                { $set: { ProtocolType, instruct } },
                { upsert: true }
            );
            await ctx.$Event.Query.RefreshCacheProtocol();
            return result;
        },
        // 删除协议
        async deleteProtocol(
            root,
            { Protocol },
            ctx: { $Event: { Query: { RefreshCacheProtocol: () => void } } }
        ) {
            const result = await DeviceProtocol.deleteOne({ Protocol });
            await ctx.$Event.Query.RefreshCacheProtocol();
            return result;
        },
        // 添加设备类型
        async addDevType(
            root,
            { arg },
            ctx: { $Event: { Query: { RefreshCacheDevType: () => void } } }
        ) {
            const { Type, DevModel, Protocols } = arg;
            const result = await DevsType.updateOne(
                { Type, DevModel },
                { $set: { Protocols } },
                { upsert: true }
            );
            await ctx.$Event.Query.RefreshCacheDevType();
            return result;
        },
        // 添加设备类型
        async deleteDevModel(
            root,
            { DevModel },
            ctx: { $Event: { Query: { RefreshCacheDevType: () => void } } }
        ) {
            const result = await DevsType.deleteOne({ DevModel });
            await ctx.$Event.Query.RefreshCacheDevType();
            return result;
        },
        // 添加登记设备
        async addRegisterTerminal(root, { DevMac, mountNode }) {
            return await new RegisterTerminal({ DevMac, mountNode }).save()
        },
        // 删除登记设备
        async deleteRegisterTerminal(root, { DevMac }) {
            const terminal = await Terminal.findOne({ DevMac })
            if (terminal) {
                return { ok: 0, msg: "设备已登记注册" }
            } else {
                return await RegisterTerminal.deleteOne({ DevMac })
            }
        },
        // 添加终端信息
        async addTerminal(
            root,
            { arg },
            ctx: { $Event: { Query: { RefreshCacheTerminal: () => void } } }
        ) {
            const { DevMac, name, mountNode, mountDevs } = arg;
            const result = await Terminal.updateOne(
                { DevMac, name, mountNode },
                { $set: { mountDevs } },
                { upsert: true }
            );
            await ctx.$Event.Query.RefreshCacheTerminal();
            return result;
        },
        // 删除终端信息
        async deleteTerminal(
            root,
            { DevMac },
            ctx: { $Event: { Query: { RefreshCacheTerminal: () => void } } }
        ) {
            const result = await Terminal.deleteOne({ DevMac });
            await ctx.$Event.Query.RefreshCacheTerminal();
            return result;
        },
        // 添加终端挂载信息
        async addTerminalMountDev(
            root,
            { arg },
            ctx: ApolloCtx
        ) {
            const { DevMac, Type, mountDev, protocol, pid } = arg;
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
            await ctx.$Event.Query.RefreshCacheTerminal();
            return result;
        },
        // 删除终端挂载设备
        async delTerminalMountDev(root, { DevMac, mountDev, pid }, ctx: ApolloCtx) {
            const result = await Terminal.updateOne({ DevMac }, { $pull: { mountDevs: { mountDev, pid } } })
            await ctx.$Event.Query.RefreshCacheTerminal()
            return result
        },
        // 修改终端挂载设备
        async modifyTerminalMountDev(root, { DevMac, pid, arg }, ctx: ApolloCtx) {
            const result = await Terminal.updateOne({ DevMac, 'mountDevs.pid': pid }, { $set: { "mountDevs.$": arg } })
            await ctx.$Event.Query.RefreshCacheTerminal()
            return result
        },
        // 添加用户
        async addUser(root, { arg }) {
            const userStat = await Users.findOne({ user: arg.user });
            if (userStat) return { ok: 0, msg: "账号有重复,请重新编写账号" };
            const user = Object.assign(arg, { passwd: await BcryptDo(arg.passwd) });
            const User = new Users(user);
            return await User.save()
                .then(() => {
                    return { ok: 1, msg: "账号注册成功" };
                })
                .catch((e) => console.log(e));
        },
        // 添加用户绑定终端
        async addUserTerminal(root, { type, id }, ctx: { user: any }) {
            switch (type) {
                case "UT":
                    return await UserBindDevice.updateOne(
                        { user: ctx.user },
                        { $addToSet: { UTs: id } },
                        { upsert: true }
                    );
                case "EC":
                    return await UserBindDevice.updateOne(
                        { user: ctx.user },
                        { $addToSet: { ECs: id } },
                        { upsert: true }
                    );
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
                | DevConstant_TH;
            }
        ) {
            let Up
            switch (type) {
                case "Constant":
                    Up = { Constant: arg }
                    break
                case "ShowTag":
                    Up = { Threshold: arg }
                case "Threshold":
                    Up = { ShowTag: arg }
                    break
            }
            const result = await DevConstant.updateOne(
                { Protocol, ProtocolType },
                { $set: Up },
                { upsert: true }
            )
            return result;
        },

    }
};

export default resolvers 