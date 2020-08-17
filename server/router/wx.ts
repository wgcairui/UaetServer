import { ParameterizedContext } from "koa";
import axios, { AxiosResponse } from "axios";
import { Users, UserAlarmSetup } from "../mongoose/user";
import {
  KoaCtx,
  wxRequestCode2Session,
  UserInfo,
  ApolloMongoResult,
  userSetup,
  logUserLogins
} from "uart";
import { WXBizDataCrypt } from "../util/wxUtil";
import { BcryptDo } from "../util/bcrypt";
import { LogUserLogins } from "../mongoose/Log";
const wxSecret = require("../key/wxSecret.json");

export default async (Ctx: ParameterizedContext) => {
  const ctx: KoaCtx = Ctx as any;
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body;
  const type = ctx.params.type;
  const ClientCache = ctx.$Event.ClientCache;

  switch (type) {
    // 微信登录
    case "code2Session":
      {
        // 没有code报错
        ctx.assert(body.js_code, 400, "需要微信code码");
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxSecret.appid}&secret=${wxSecret.secret}&js_code=${body.js_code}&grant_type=authorization_code`;
        const wxGetseesion = await axios
          .get<any, AxiosResponse<wxRequestCode2Session>>(url)
          .catch(e => {
            console.log(e);
            ctx.throw("code2Session", 400);
          });
        // 包含错误
        ctx.assert(!wxGetseesion.data.errcode, 401, wxGetseesion.data.errmsg);
        const { openid, session_key } = wxGetseesion.data;
        // 存储session
        ClientCache.CacheWXSession.set(openid, session_key);
        // 检查openid是否为已注册用户
        const user = (await Users.findOne({ userId: openid }).lean()) as UserInfo;
        if (user) {
          ctx.body = {
            ok: 1,
            arg: { user: user.user, userGroup: user.userGroup }
          } as ApolloMongoResult;
        } else {
          ctx.body = {
            ok: 0,
            msg: "微信未绑定平台账号，请先注册使用",
            arg: { openid }
          } as ApolloMongoResult;
        }
      }
      break;
    // 解密手机号码
    case "getphonenumber":
      {
        const { encryptedData, iv, appid } = body;
        // 获取用户最近的seesionKey
        const session_key = ClientCache.CacheWXSession.get(appid);
        ctx.assert(session_key, 400, "appid is nologin");
        const Crypt = new WXBizDataCrypt(session_key as string);
        ctx.body = {
          ok: 1,
          arg: Crypt.decryptData(encryptedData, iv)
        } as ApolloMongoResult;
      }
      break;
    // 微信用户注册
    case "register":
      {
        const data: {
          appid: string;
          user: string;
          name: string;
          tel: string;
          mail: string;
          avanter: string;
        } = body;
        const userStat = await Users.findOne({ userId: data.appid });
        ctx.assert(!userStat, 400, "账号有重复,此微信账号已绑定");
        //
        const telStat = await Users.findOne({ $or:[{tel:data.tel},{mail:data.mail}] });
        ctx.assert(!telStat, 400, "手机或邮箱号重复,请重新填写");
        //
        const user = Object.assign(
          body,
          {userId: data.appid},
          { passwd: await BcryptDo(data.appid) },
          { rgtype: "wx" }
        ) as UserInfo;
        const User = new Users(user);
        ctx.body = await User.save()
          .then(() => {
            // 生成用户新的自定义配置
            const setup: Partial<userSetup> = {
              user: user.user,
              tels: user.tel ? [String(user.tel)] : [],
              mails: user.mail ? [user.mail] : []
            };
            new UserAlarmSetup(setup).save();
            // 添加日志记录
            new LogUserLogins({
              user: user.user,
              type: "用户注册"
            } as logUserLogins).save();
            return { ok: 1, msg: "账号注册成功" };
          })
          .catch(e => console.log(e));
      }
      break;
  }
};
