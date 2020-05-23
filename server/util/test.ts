// 测试16进制转单精度浮点数
function BufferToFlot() {
    const buf = Buffer.from("436499A0", 'hex')
    //16进制转2进制
    const bit16 = parseInt(buf.toString('hex', 0, 4), 16)
    const bit2 = bit16.toString(2)
    //slice表示数组的截取，并转化为十进制数
    const bit10 = parseInt(bit2.slice(0, 8), 2)
    //获得尾数
    const M2 = bit2.slice(8, 64)
    //将二进制的尾数转化为十进制的小数
    let M10 = 0.00
    for (let i = 0; i < M2.length; i++) {
        M10 = M10 + (M2 as any)[i] * Math.pow(2, (-1) * (i + 1))
    }
    //最后利用公式转化为十进制
    const value = Math.pow(2, bit10 - 127) * (1 + M10)
    console.log({ buf, bit16, bit2, bit10, M2, M10, value });

}

import tool from "./tool";
const a = tool.HX(1, '10 20 50 00 00 00 00 00 00 00 00 00')
console.log(a);

