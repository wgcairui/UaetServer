/* app端用api */
import { ParameterizedContext } from "koa";
import Tool from "../util/tool";
import { Uart } from "typing";

interface CRC {
    protocolType: number
    pid: number
    instructN: string
    address: number
    value: number
}
export default async (Ctx: ParameterizedContext) => {
    const ctx: Uart.KoaCtx = Ctx as any;
    const body = ctx.request.body as { [x: string]: any }
    const type = ctx.params.type;

    switch (type) {
        case "CRC":
            {
                const { protocolType, pid, instructN, address, value } = body as CRC
                switch (protocolType) {
                    case 0:
                        {

                            const c = Buffer.allocUnsafe(2)
                            c.writeIntBE(address, 0, 2)
                            const start = c.slice(0, 2).toString("hex")

                            const d = Buffer.allocUnsafe(2)
                            d.writeIntBE(value, 0, 2)
                            const end = d.slice(0, 2).toString("hex")

                            ctx.body = Tool.Crc16modbus(pid, instructN + start + end)

                        }
                        break
                    case 1:
                        {
                            return ''
                        }
                        break
                }
            }
            break;

        default:
            break;
    }

};
