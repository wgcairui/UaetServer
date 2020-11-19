import ProtocolPares from "./ProtocolPares";
import { TerminalClientResults, TerminalClientResult, TerminalClientResultSingle } from "../mongoose/node";
import CheckUart from "./CheckUart";
import { LogUseBytes } from "../mongoose/Log";
import { Uart } from "typing";

export default async (queryResultArray: Uart.queryResult[]) => {
    if (queryResultArray.length > 0) {
        // 保存每个终端使用的数字节数
        SaveTerminaluseBytes(queryResultArray)
        // 保存原始数据
        TerminalClientResults.insertMany(queryResultArray);
        // 翻转结果数组,已新的结果为准
        const UartData = queryResultArray.reverse()
        // 解析结果
        const ParseData = UartData.map(el => ProtocolPares.parse(el))
        // 保存解析后的数据
        TerminalClientResult.insertMany(ParseData);
        // 保存单例数据库
        // 创建缓存,保存每条数据的Set
        const MacID: Set<string> = new Set()
        ParseData.forEach(data => {
            const ID = data.mac + data.pid
            // 如果数据重复,抛弃旧数据
            if (!MacID.has(ID)) {
                MacID.add(ID)
                // 把数据发给检查器,检查数据是否有故障,保存数据单例
                const checkData = CheckUart.check(data)
                // 把结果转换为对象
                data.parse = Object.assign({}, ...checkData.result!.map(el => ({ [el.name]: el })) as { [x: string]: Uart.queryResultArgument }[])
                // console.log({checkData});
                // 保存对象
                // console.log(data.result);
                
                TerminalClientResultSingle.updateOne(
                    { mac: checkData.mac, pid: checkData.pid },
                    checkData,
                    { upsert: true }
                ).exec()
            }
        })
    }
}
// 保存每个查询指令使用的字节，以天为单位
async function SaveTerminaluseBytes(queryResult: Uart.queryResult[]) {
    const date = new Date().toLocaleDateString()
    for (let el of queryResult) {
        await LogUseBytes.updateOne({ mac: el.mac, date }, { $inc: { useBytes: el.useBytes } }, { upsert: true }).exec()
    }
}