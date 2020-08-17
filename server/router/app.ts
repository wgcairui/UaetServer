/* app端用api */
import { ParameterizedContext } from "koa";
import { JwtVerify, JwtSign } from "../util/Secret";
import { UserInfo, KoaCtx, ApolloMongoResult, userSetup, logUserLogins } from "uart";
import { RegisterTerminal, Terminal } from "../mongoose/Terminal";
import { Users, UserAlarmSetup } from "../mongoose/user";
import { BcryptDo } from "../util/bcrypt";
import { LogUserLogins } from "../mongoose/Log";
import { SendValidation } from "../util/SMS";
import Tool from "../util/tool";
export default async (Ctx: ParameterizedContext) => {
  const ctx: KoaCtx = Ctx as any;
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body;
  const type = ctx.params.type;
  // 所有的请求都需要检查token，没有token返回err
  if(body.token){
    ctx.assert(body.token, 400, "no token");
    const user: UserInfo = await JwtVerify(body.token).catch(err => ctx.throw(401));
    switch (type) {
      case "nodes":
        {
          const nodes = Array.from(ctx.$Event.Cache.CacheNodeName.keys());
          ctx.body = { nodes };
        }
        break;
      case "registerTerminal":
        {
          const { node, codes }: { node: string; codes: string[] } = body;
          ctx.assert(node || codes, 400, "参数错误");
        //
          const resut = codes.map(async el => {
            if (ctx.$Event.Cache.CacheTerminal.has(el)) {
              return el + "重复注册\n";
            } else {
              await new RegisterTerminal({ DevMac: el, mountNode: node }).save();
              await Terminal.updateOne(
                { DevMac: el },
                { $set: { mountNode: node, name: el } },
                { upsert: true }
              ).exec();
              await ctx.$Event.Cache.RefreshCacheTerminal(el);
              return el + "注册成功\n";
          }
        });
        const msg = await Promise.all(resut);
        ctx.body = { msg: msg.join(""), ok: 1 } as ApolloMongoResult;
        }
        break;
    }
  }else{
    switch (type) {
      // 添加用户
      case "adduser":
        {     
          //
              const userStat = await Users.findOne({ user: body.user });
              ctx.assert(!userStat,400,"账号有重复,请重新填写账号")
              //
              const telStat = await Users.findOne({ user: body.tel });
              ctx.assert(!telStat,400,"手机号码有重复,请重新填写号码")
              //
              /* const mailStat = await Users.findOne({ user: body.mail });
              ctx.assert(!mailStat,400,"邮箱账号有重复,请重新填写邮箱")
              // */
              const user = Object.assign(body, { passwd: await BcryptDo(body.passwd) },{rgtype:"app"}) as UserInfo
              const User = new Users(user);
              ctx.body = await User.save()
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
        }
        break;
        // 重置用户，发送校验码
        case "resetUserPasswd":
        {
          const User = await Users.findOne({ $or: [{ user:body.user }, { mail: body.user }] }).lean<UserInfo>()
            if (User) {
                const code = (Math.random() * 10000).toFixed(0)
                ctx.$Event.ClientCache.CacheUserValidationCode.set('reset' + User.user, code)
                const res = await SendValidation(String(User.tel), code)
                if (res.ok) res.msg = Tool.Mixtel(User.tel)
                ctx.body = res
            } else {
              ctx.body = { ok: 0, msg: '账号不存在,请和对账号' } as ApolloMongoResult
            }
        }
        break;
        // 效验用户验证码
        case "resetValidationCode":
        {
          const {user,code,passwd} = body
          const codeMap = ctx.$Event.ClientCache.CacheUserValidationCode;
          if (codeMap.has('reset' + user)) {
                if (code === codeMap.get('reset' + user)) {
                    codeMap.delete('reset' + user)
                    ctx.body = await Users.updateOne({ user }, { $set: { passwd: await BcryptDo(passwd) } })
                } else {
                  ctx.body =  { ok: 0, msg: '校验码不正确' } as ApolloMongoResult
                }
          } else {
            ctx.body =  { ok: 0, msg: '没有校验码,请重新获取' } as ApolloMongoResult
          }
        }
        break

    }
  }
};
