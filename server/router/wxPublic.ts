import { ParameterizedContext } from "koa";
import sha1 from "sha1";
import { Uart } from "typing";

const Token = "6wF2e3auzFxQP4NamBCw"
const EncodingAESKey = "jMTwdwFmxqlxnQsMjZfVhIqFcefuRjiKGGtekuNzkxf"

interface wxValidation {
    signature: string,
    timestamp: string,
    nonce: string,
    echostr: string
}

export default async (Ctx: ParameterizedContext) => {
    const ctx: Uart.KoaCtx = Ctx as any;
    const body: wxValidation = ctx.method === "GET" ? ctx.query : ctx.request.body;
    const { signature, timestamp, nonce, echostr } = body
    const sha = sha1([Token, timestamp, nonce].sort().join(''))
    ctx.body = sha === signature ? echostr : false
}