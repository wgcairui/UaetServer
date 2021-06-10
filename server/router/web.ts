import { JwtVerify } from "../util/Secret";
import { KoaIMiddleware } from "typing";
import wxUtil from "../util/wxUtil";

const Middleware: KoaIMiddleware = async (ctx) => {
    const body = ctx.method === "GET" ? ctx.query : ctx.request.body
    const type = ctx.params.type;
    const authToken = ctx.cookies.get("auth._token.local") as string
    const token = authToken.replace(/^bearer%20/ig, "").trim()
    const tokenUser: Uart.UserInfo | null = await JwtVerify(token).catch(() => null)
    if (tokenUser) {
        switch (type) {
            // 获取公众号二维码
            case "ticketPublic":
                {
                    ctx.body = await wxUtil.getTicketPublic(tokenUser.user)
                }
                break
            // 获取小程序二维码
            case "ticket":
                {
                    ctx.body = await wxUtil.getTicket(tokenUser.user)
                }
                break
        }
    }


}

export default Middleware