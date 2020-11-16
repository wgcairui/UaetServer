import { IResolvers } from "apollo-server-koa";
import _ from "lodash"
import { UserAggregation, DevConstant, UserBindDevice, Terminal, EcTerminal, LogUartTerminalDataTransfinite, LogUserLogins } from "../../mongoose";
import { LogTerminals, Users } from "../../mongoose";
import { TerminalClientResultSingle, UserAlarmSetup } from "../../mongoose";
import Tool from "../../util/tool";
import { Uart } from "typing";
import { BcryptDo } from "../../util/bcrypt";
import { ParseCoefficient } from "../../util/func";
import { JwtSign, JwtVerify } from "../../util/Secret";
import { SendValidation } from "../../util/SMS";
import { getUserBindDev } from "../../util/util";

const resolvers: IResolvers<undefined, Uart.ApolloCtx> = {
    Query: {
        
        // 获取设备在线状态
        getDevState(root, { mac, node }, ctx) {
            return ctx.$Event.Cache.CacheNodeTerminalOnline.has(mac)
        },
        // 获取用户自定义配置
        async getUserSetup(root, arg, ctx) {
            return await UserAlarmSetup.findOne({ user: ctx.user })
        },
        // 获取协议常量
        async getUserDevConstant(root, { Protocol }, ctx) {
            const userSetup = ctx.$Event.Cache.CacheUserSetup.get(ctx.user as string)!
            const res = userSetup.ProtocolSetupMap.get(Protocol)
            // const res = await UserAlarmSetup.findOne({ user: ctx.user,"ProtocolSetup.Protocol":Protocol },{"ProtocolSetup.Protocol":1,user:1})
            // console.log({ userSetup, res });
            return res
        },
        // 获取用户设备日志
        async getLogTerminal(root, arg, ctx) {
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
        async getUserTel(root, arg, ctx) {
            const user = await Users.findOne({ user: ctx.user }).lean<Uart.UserInfo>()
            const tel = Tool.Mixtel(user!.tel)
            return tel
        },
        // 检查挂载设备是否在超时列表中
        checkDevTimeOut(root, { mac, pid }: { mac: string, pid: string }, ctx) {
            if (!ctx.$Event.Cache.CacheNodeTerminalOnline.has(mac)) return 'DTUOFF'
            if (ctx.$Event.Cache.TimeOutMonutDev.has(mac + pid)) return 'TimeOut'
            return 'online'
        },
        // id获取用户聚合设备
        async Aggregation(root, { id }, ctx) {
            const agg = await UserAggregation.findOne({ id, user: ctx.user }).lean<Uart.Aggregation>()
            if (!agg) return agg
            const query = agg.aggregations.map(async el => {
                const constant = await DevConstant.findOne({ Protocol: el.protocol }).select("Constant").lean() as Uart.ProtocolConstantThreshold
                const constantVals = _.pickBy(constant.Constant, Boolean) as any
                const ter = await TerminalClientResultSingle.findOne({ mac: el.DevMac, pid: el.pid }).select("parse time").lean() as Uart.queryResult
                // ter.parse = _.pick(ter.parse,constantVals) as any
                const constantParse = {} as { [x in string]: Uart.queryResultArgument }
                for (let key in constantVals) {
                    constantParse[key] = (ter.parse as any)[constantVals[key]]
                }
                // console.log({ constantParse });
                return Object.assign(el, { parse: constantParse })
            })
            agg.devs = await Promise.all(query) as any
            return agg
        },
        // 获取用户组
        userGroup(root, arg, ctx) {
            return ctx.userGroup;
        },
        // 绑定设备信息
        async BindDevice(root, arg, ctx) {
            const Bind: any = await UserBindDevice.findOne({ user: ctx.user }).lean();
            if (!Bind) return null;
            Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } }).lean();
            Bind.ECs = await EcTerminal.find({ ECid: { $in: Bind.ECs } }).lean();
            Bind.AGG = await UserAggregation.find({ user: ctx.user })
            //
            Bind.UTs = Bind.UTs.map((el: any) => {
                el.online = ctx.$Event.Cache.CacheNodeTerminalOnline?.has(el.DevMac)
                if (el.online && el?.mountDevs?.length > 0) {
                    el.mountDevs.forEach((element: any) => {
                        element.online = !ctx.$Event.Cache.TimeOutMonutDev.has(el.DevMac + element.pid)
                    });
                }
                return el
            })
            return Bind;
        },

    },


    Mutation: {

        // 添加用户
        async addUser(root, { arg }, ctx) {
            if (await Users.findOne({ user: arg.user })) return { ok: 0, msg: "账号有重复,请重新编写账号" };
            if (await Users.findOne({ user: arg.tel })) return { ok: 0, msg: "手机号码有重复,请重新填写号码" };
            if (await Users.findOne({ user: arg.mail })) return { ok: 0, msg: "邮箱账号有重复,请重新填写邮箱" };
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
        //
        async modifyUserInfo(root, { arg }, ctx) {
            const keys = Object.keys(arg)
            if (keys.includes('user')) return { ok: 0, msg: '不能修改用户名' } as Uart.ApolloMongoResult
            if (keys.includes('userGroup') && ctx.userGroup !== 'root') return { ok: 0, msg: '权限校验失败' } as Uart.ApolloMongoResult
            if (keys.some(el => arg[el].length > 50)) return { ok: 0, msg: '参数值过长' } as Uart.ApolloMongoResult
            const res = await Users.updateOne({ user: ctx.user }, { $set: arg })
            ctx.$Event.Cache.RefreshCacheUser(ctx.user)
            return res
        },
        // 添加用户绑定终端
        async addUserTerminal(root, { type, id }, ctx) {
            switch (type) {
                case "UT":
                    {
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
        // 添加用户绑定终端
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

        //  固定发送设备操作指令
        async SendProcotolInstructSet(root, { query, item }: { query: Uart.instructQueryArg, item: Uart.OprateInstruct }, ctx) {
            // 验证客户是否校验过权限
            const juri = ctx.$Event.ClientCache.CacheUserJurisdiction.get(ctx.user as string)
            if (!juri || juri !== ctx.$token) {
                return { ok: 4, msg: "权限校验失败,请校验身份" } as Uart.ApolloMongoResult
            }
            // 获取协议指令
            const protocol = ctx.$Event.Cache.CacheProtocol.get(query.protocol) as Uart.protocol
            // 检查操作指令是否含有自定义参数
            if (/(%i)/.test(item.value)) {
                // 如果识别字为%i%i,则把值转换为四个字节的hex字符串,否则转换为两个字节
                if (/%i%i/.test(item.value)) {
                    const b = Buffer.allocUnsafe(2)
                    b.writeIntBE(ParseCoefficient(item.bl, Number(item.val)), 0, 2)
                    item.value = item.value.replace(/(%i%i)/, b.slice(0, 2).toString("hex"))
                } else {
                    item.value = item.value.replace(/(%i)/, ParseCoefficient(item.bl, Number(item.val)).toString(16))
                }
                console.log({ msg: '发送查询指令', item });
            }
            // 携带事件名称，触发指令查询
            const Query: Uart.instructQuery = {
                protocol: query.protocol,
                DevMac: query.DevMac,
                pid: query.pid,
                type: protocol.Type,
                events: 'oprate' + Date.now() + query.DevMac,
                content: item.value
            }
            const result = await ctx.$Event.DTU_OprateInstruct(Query)
            return result
        },

        //  固定发送DTU AT指令
        async Send_DTU_AT_InstructSet(root, { DevMac, content }: { DevMac: string, content: string }, ctx) {
            // 验证客户是否校验过权限
            if (ctx.userGroup !== 'root') return { ok: 4, msg: "权限校验失败,请校验身份" } as Uart.ApolloMongoResult
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

        // 设置用户自定义设置(联系方式)
        async setUserSetupContact(root, { tels, mails }: { tels: string[], mails: string[] }, ctx) {
            const result = await UserAlarmSetup.updateOne({ user: ctx.user }, { $set: { tels: tels || [ctx.tel], mails: mails || [ctx.mail] } }, { upsert: true })
            ctx.$Event.Cache.RefreshCacheUserSetup(ctx.user)
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
                    Up = { "ProtocolSetup.$.Constant": arg }
                    break
                case "Threshold":
                    Up = { "ProtocolSetup.$.Threshold": arg }
                    break
                case "ShowTag":
                    Up = { "ProtocolSetup.$.ShowTag": _.compact(arg as string[]) }
                    break
                case "AlarmStat":
                    Up = { "ProtocolSetup.$.AlarmStat": arg }
                    break
                case "Oprate":
                    Up = { OprateInstruct: arg }
                    break
            }
            const isNull = await UserAlarmSetup.findOne({ user: ctx.user, "ProtocolSetup.Protocol": Protocol }).exec()
            if (!isNull) {
                await UserAlarmSetup.updateOne({ user: ctx.user }, { $set: { ProtocolSetup: { Protocol } } }).exec()
            }
            // console.log({ isNull, user: ctx.user });

            const result = await UserAlarmSetup.updateOne(
                { user: ctx.user, "ProtocolSetup.Protocol": Protocol },
                { $set: Up },
                { upsert: true }
            )
            ctx.$Event.Cache.RefreshCacheUserSetup(ctx.user)
            return result;
        },
        // 发送验证码
        async sendValidationSms(root, arg, ctx) {
            const user = await Users.findOne({ user: ctx.user }).lean<Uart.UserInfo>()
            const code = (Math.random() * 10000).toFixed(0)
            ctx.$Event.ClientCache.CacheUserValidationCode.set(ctx.$token, code)
            return await SendValidation(String(user!.tel), code)
        },
        // 校验验证码,校验通过缓存授权
        ValidationCode(root, { code }, ctx) {
            const userCode = ctx.$Event.ClientCache.CacheUserValidationCode.get(ctx.$token)
            if (!userCode || !code) return { ok: 0, msg: '校验码不存在,请重新发送校验码' } as Uart.ApolloMongoResult
            if (userCode !== code) return { ok: 0, msg: '校验码不匹配,请确认校验码是否正确' } as Uart.ApolloMongoResult
            // 缓存权限
            ctx.$Event.ClientCache.CacheUserJurisdiction.set(ctx.user as string, ctx.$token)
            return { ok: 1, msg: "校验通过" } as Uart.ApolloMongoResult
        },
        // 重置用户密码
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
        //校验用户验证码
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
        // 重置用户密码
        async setUserPasswd(root, { hash, passwd }: { hash: string, passwd: string }, ctx) {
            const { user } = await JwtVerify(hash)
            if (!user) return { ok: 0, msg: 'token出错' } as Uart.ApolloMongoResult
            ctx.$Event.ClientCache.CacheUserValidationCode.delete('reset' + user)
            return await Users.updateOne({ user }, { $set: { passwd: await BcryptDo(passwd) } })
        },
        // 添加聚合设备
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
        async deleteAggregation(root, { id }, ctx) {
            const result = await UserAggregation.deleteOne({ user: ctx.user, id })
            return result
        },
        // 重置设备超时状态
        refreshDevTimeOut(root, { mac, pid }: { mac: string, pid: string }, ctx) {
            ctx.$Event.ResetTimeOutMonutDev(mac, parseInt(pid))
            return { ok: 1 } as Uart.ApolloMongoResult
        },
        // 确认用户告警
        async confrimAlarm(root, { id }, ctx) {
            const BindDevs: string[] = getUserBindDev(ctx.user)
            if (id) {
                const doc = await LogUartTerminalDataTransfinite.findById(id, "mac").lean<Uart.uartAlarmObject>()
                if (doc && BindDevs.includes(doc.mac)) {
                    // 确认告警缓存清除
                    const tags = doc.mac + doc.pid + doc.tag
                    ctx.$Event.Cache.CacheAlarmNum.delete(tags)
                    return await LogUartTerminalDataTransfinite.findByIdAndUpdate(id, { $set: { isOk: true } }).exec()
                } else return { ok: 0 } as Uart.ApolloMongoResult
            } else {
                return await LogUartTerminalDataTransfinite.updateMany({ mac: { $in: BindDevs } }, { $set: { isOk: true } }).exec()
            }
        },
    }
};

export default resolvers