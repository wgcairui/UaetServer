import sha1 from "sha1";
import { parseStringPromise } from "xml2js"
import WxUtil from "../util/wxUtil"

const Token = "6wF2e3auzFxQP4NamBCw"
const EncodingAESKey = "jMTwdwFmxqlxnQsMjZfVhIqFcefuRjiKGGtekuNzkxf"


/**
 * xml2Js解析出来的数据格式
 */
interface xmlObj {
    xml: {
        [x: string]: string[]
    }
}
import { KoaIMiddleware } from "typing";
import { LogWXEvent, mongoose, Users } from "../mongoose";
const Middleware: KoaIMiddleware = async (ctx) => {
    const body: Uart.WX.wxValidation | Uart.WX.WxEvent = ctx.method === "GET" ? ctx.query : await parseStringPromise(ctx.request.body).then(el => parseXmlObj(el) as any);
    console.log({ body });
    new LogWXEvent(body).save()
    // 微信校验接口
    if ('signature' in body) {
        const { signature, timestamp, nonce, echostr } = body
        const sha = sha1([Token, timestamp, nonce].sort().join(''))
        ctx.body = sha === signature ? echostr : false
        return
    }
    const { ToUserName, FromUserName, CreateTime, Event } = body
    ctx.type = 'application/xml'
    // WxUtil.SendsubscribeMessageDevAlarmPublic(body.FromUserName, Date.now(), 'ceshitemplate', 'HS033', 'ups', 'bettry hight')
    // 进入事件处理流程
    if (Event) {
        switch (Event) {
            // 关注公众号
            case "subscribe":
                WxUtil.saveUserInfo(FromUserName)
                ctx.body = 'success'
                break;
            // 取消关注
            case "unsubscribe":
                WxUtil.deleteUserInfo(FromUserName)
                break

            case "SCAN":
                {
                    /**
                     * 如果是通过二维码扫码绑定账号
                     * 通过判断有这个用户和用户还没有绑定公众号
                     * 
                     */
                    if ("Ticket" in body) {
                        const { EventKey, FromUserName } = body
                        const Id = mongoose.Types.ObjectId(EventKey)
                        const user = await Users.findOne({ _id: Id }).lean()
                        if (user && !user.wxId) {
                            const { unionid, headimgurl } = await WxUtil.getUserInfoPublic(FromUserName)
                            // 如果用户没有绑定微信或绑定的微信是扫码的微信
                            if (!user.userId || user.userId === unionid) {
                                await Users.updateOne({ _id: Id }, { $set: { userId: unionid, wxId: FromUserName, avanter: headimgurl } }).exec()
                                ctx.body = TextMessege(body, `您好:${user.name}\n 欢迎绑定透传账号到微信公众号,我们将会在以后发送透传平台的所有消息至此公众号,请留意新信息提醒!!!`)
                                return
                            }
                        }
                    }
                }
                break

            default:
                break;
        }
        ctx.body = "success"
        return
    }
    // 自动回复信息
    ctx.body = TextMessege(body, '详情请咨询400-6655778\n\n 招商专线18971282941')

}

/**
 * 返回图文消息
 * @param data 
 * @returns 
 */
function TextMessege(event: Pick<Uart.WX.WxEvent, 'FromUserName' | 'ToUserName' | 'CreateTime'>, content: string) {
    return `<xml><ToUserName><![CDATA[${event.FromUserName}]]></ToUserName>` +
        `<FromUserName><![CDATA[${event.ToUserName}]]></FromUserName>` +
        `<CreateTime>${event.CreateTime + 100}</CreateTime>` +
        `<MsgType><![CDATA[text]]></MsgType>` +
        `<Content><![CDATA[${content}]]></Content></xml>`
}




/**
 * xml转换为onj
 * @param data 
 * @returns 
 */
function parseXmlObj(data: xmlObj): Uart.WX.WxEvent {
    const r = data.xml
    const a = {} as any
    for (let i in r) {
        a[i] = r[i][0]
    }
    return a
}

export default Middleware