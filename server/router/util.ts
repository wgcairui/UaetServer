import AMapAPI from "../util/AMapAPI";
import { Uart } from "types-uart";

type type1 = 'AMap'

import { KoaIMiddleware } from "typing";
const Middleware: KoaIMiddleware = async (ctx) => {
    const body: { token: string, [x: string]: any } = ctx.method === "GET" ? ctx.query : ctx.request.body;
    const type1: type1 = ctx.params.type1 as any;
    const type2 = ctx.params.type2 as string;

    if (!body?.token) {
        ctx.throw("no token")
    }
    if (body.token !== '38_HFuhHEaxyKgthO-vgUzCIioWUHbkUlBYOsUoczHZU6VhLAfXOGIgAL2px8ApStw_u1XLGFIVxrgkYfxlRkVP8idjEch0Ykg0-ETwB8us19rXxWU6aKTbaoAS9Gma_N4UgtWZBbM7_r0OPkHHXHVgAEAGQE') {
        ctx.throw("token Error")
    }
    // console.log({body});

    switch (type1) {
        case "AMap":
            {
                switch (type2) {
                    case "IP2loction":
                        {
                            const ip = body.ip as string
                            ctx.body = {
                                query: body,
                                code: 200,
                                result: await AMapAPI.IP2loction(ip)
                            }
                        }

                        break;
                    case "GPS2autonavi":
                        {
                            const locations = body.locations as string | string[]
                            const coordsys = body.coordsys as string || 'gps'
                            ctx.body = {
                                code: 200,
                                query: body,
                                result: await AMapAPI.GPS2autonavi(locations, coordsys as any)
                            }
                        }
                        break
                }
            }

            break;
    }

}

export default Middleware