import { queryResult, queryResultArgument } from "./interface";
import ProtocolPares from "./ProtocolPares";
import { TerminalClientResults, TerminalClientResultSingle, TerminalClientResult } from "../mongoose/node";
import CheckUart from "./CheckUart";

export default async (queryResultArray: queryResult[]) => {
    const UartData = queryResultArray.reverse()
    // 保存原始数据
    TerminalClientResults.insertMany(UartData);
    //
    const ParseData = await Promise.all(UartData.map(el => ProtocolPares(el)));
    // 保存解析后的数据
    TerminalClientResult.insertMany(ParseData);
    // 保存单例数据库
    // 创建缓存,保存每条数据的Set
    const MacID: Set<string> = new Set()
    ParseData.forEach(data => {
        const ID = data.mac + data.pid
        // 如果数据重复,抛弃旧数据
        if (MacID.has(ID)) return
        MacID.add(ID)
        // 把结果转换为对象
        const P = data.result?.map(el => ({ [el.name]: el })) as { [x: string]: queryResultArgument }[]
        data.parse = Object.assign({}, ...P)
        //保存对象
        TerminalClientResultSingle.updateOne(
            { mac: data.mac, pid: data.pid },
            data,
            { upsert: true }
        ).exec()
        // 把数据发给检查器,检查数据是否有故障
        CheckUart(data)
    })
}