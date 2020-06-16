import { queryResult, queryResultArgument } from "./interface";
import ProtocolPares from "../util/ProtocolPares";
import { TerminalClientResults, TerminalClientResult, TerminalClientResultSingle } from "../mongoose/node";
import CheckUart from "./CheckUart";

export default async (queryResultArray: queryResult[]) => {
    if (queryResultArray.length === 0) return
    const UartData = queryResultArray.reverse()
    // 保存原始数据
    TerminalClientResults.insertMany(UartData);
    //
    const ParseData = await Promise.all(UartData.map(el => ProtocolPares(el)))
        .then(el => el.filter(el2 => el2.result?.length as number > 0))
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
        data.parse = Object.assign({}, ...data.result?.map(el => ({ [el.name]: el })) as { [x: string]: queryResultArgument }[])
        // 把数据发给检查器,检查数据是否有故障,保存数据单例
        const checkData = CheckUart(data)
        console.log({checkData});
        
        //保存对象
        TerminalClientResultSingle.updateOne(
            { mac: checkData.mac, pid: checkData.pid },
            checkData,
            { upsert: true }
        ).exec()
    })
}