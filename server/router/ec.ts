/* app端用api */
import { ParameterizedContext } from "koa";
import { Uart } from "typing";
import * as DB from "../mongoose"

export default async (Ctx: ParameterizedContext) => {
    const ctx: Uart.KoaCtx = Ctx as any;
    const mac = ctx.header.mac
    ctx.assert(mac, 400, 'must submit ecMac')
    const body = ctx.method === "GET" ? ctx.query : ctx.request.body
    const type = ctx.params.type;

    switch (type) {
        // ec请求数据
        case 'syncSetup':
            {
                const protocol = await DB.DeviceProtocol.find().lean<Uart.protocol>()
                const device = await DB.DevsType.find().lean<Uart.DevsType>()
                const constant = await DB.DevConstant.find().lean<Uart.ConstantAlarmStat>()
                ctx.body = { ok: 1, arg: { protocol, device, constant } } as Uart.ApolloMongoResult
            }
            break
    }

};
