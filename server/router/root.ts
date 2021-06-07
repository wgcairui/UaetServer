import { JwtVerify } from "../util/Secret";
import { KoaIMiddleware } from "typing";
import wxUtil from "../util/wxUtil";
import { LogWXEvent, SecretApp, Users, WxUsers } from "../mongoose";

const Middleware: KoaIMiddleware = async (ctx) => {
    const body = ctx.request.body
    const type = ctx.params.type;
    const authToken = ctx.cookies.get("auth._token.local") as string
    const token = authToken.replace(/^bearer%20/ig, "").trim()
    const tokenUser: Uart.UserInfo | null = await JwtVerify(token).catch(() => null)
    if (tokenUser && tokenUser.userGroup === 'root') {
        switch (type) {
            // 获取wx公众号图文列表
            case "materials_list":
                const { type, offset, count } = body
                ctx.body = await wxUtil.get_materials_list_Public({ type, offset, count })
                break

            // 获取所有公众号用户
            case "wx_users":
                ctx.body = await WxUsers.find()
                break

            // 更新公众号用户资料库
            case "update_wx_users_all":
                ctx.body = await wxUtil.saveUserInfo()
                break

            // 向指定用户推送信息
            case "wx_send_info":
                {
                    const key = body.type || 0
                    console.log({ body });
                    if (body.openid) {
                        switch (key) {
                            // 公众号测试发送设备告警短信
                            case 0:
                                ctx.body = await wxUtil.SendsubscribeMessageDevAlarmPublic(body.openid, Date.now(), body.content || '测试响应', 'test1', 'ups', 'test')
                                break;

                            case 1:

                                break;
                            case 2:

                                break;
                            case 3:

                                break;
                            case 4:

                                break;
                        }
                    }

                }
                break

            // 获取微信推送事件记录
            case "log_wxEvent":
                ctx.body = await LogWXEvent.find()
                break

            // 设置第三方密匙信息
            case "setSecret":
                const { type: s, appid, secret } = body
                ctx.body = await SecretApp.updateOne({ type: s }, { appid, secret }, { upsert: true })
                break

            // 获取第三方密匙信息
            case "getSecret":
                ctx.body = await SecretApp.findOne({ type: body.type })
                break

        }
    }


}

export default Middleware