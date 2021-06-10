import Tool from "../util/tool";
import { SendValidation } from "../util/SMS"

interface CRC {
    protocolType: number
    pid: number
    instructN: string
    address: number
    value: number
}
import { KoaIMiddleware } from "typing";
const Middleware: KoaIMiddleware = async (ctx) => {
    const body = ctx.request.body as { [x: string]: any }
    const type = ctx.params.type;

    console.log({ type, body });


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
        case "protocol":
            {
                ctx.body = [...ctx.$Event.Cache.CacheProtocol.values()]
            }
            break
        // 发送校验短信
        case "sendValidationSms":
            {
                const tel = body.tel
                ctx.assert(tel, 400, 'args error')
                const code = (Math.random() * 10000).toFixed(0).padStart(4, '0')
                ctx.body = {
                    code,
                    result: await SendValidation(tel, code)
                }
            }
            break
        default:
            break;
    }

};

export default Middleware