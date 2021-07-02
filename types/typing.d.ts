import { ParameterizedContext, Request } from "koa";
import router from "koa-router"
import { Event } from "../server/event/index"
// apollo server result
/** protocol */
type communicationType = 232 | 485;
type protocolType = "ups" | "air" | "em" | "th";
type characterType = "utf8" | "hex" | "float" | "short" | "int" | "HX" | 'bit2'
interface ApolloMongoResult {
    msg: string
    ok: number
    n: number
    nModified: number
    upserted: any,
    arg?: any
}
/**  koa ctx */
interface KoaCtx extends ParameterizedContext {
    $Event: Event
}

// 拓展koa-router属性
type routerEx = ParameterizedContext<{}, KoaCtx & router.IRouterParamContext<{}, KoaCtx>>

type KoaIMiddleware = router.IMiddleware<{}, KoaCtx>
/** apollo ctx */
interface ApolloCtx extends Uart.UserInfo {
    loggedIn: boolean
    $Event: Event
    $token: string
    operationName: string
    req: Request
    language: string
}
