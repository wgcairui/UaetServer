import { JwtVerify } from "../util/Secret";
import { KoaIMiddleware } from "typing";
import wxUtil from "../util/wxUtil";
import { LogWXEvent, WxUsers } from "../mongoose";

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
                await wxUtil.saveUserInfo()
                ctx.body = await WxUsers.find()
                break

            // 向指定用户推送信息
            case "wx_send_info":
                {
                    const key = body.type || 0
                    const userId = body.userId
                    switch (key) {
                        case 0:
                            ctx.body = await wxUtil.SendsubscribeMessageDevAlarmPublic(userId, Date.now(), '测试响应', 'test1', 'ups', 'test')
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
                break

            // 获取微信推送事件记录
            case "log_wxEvent":
                ctx.body = await LogWXEvent.find()
                break

        }
    }


}

export default Middleware