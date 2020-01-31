/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { NodeRunInfo } from "../mongoose/node";
import ProtocolPares from "../bin/ProtocolPares";
import { ParameterizedContext } from "koa";
import { queryResult } from "../bin/interface";
export default async (ctx: ParameterizedContext) => {
  const type = ctx.params.type;
  const body = ctx.request.body;
  switch (type) {
    // 透传设备数据上传接口
    case "UartData":
      {
        const { data }: { data: queryResult[] } = body;
        // eslint-disable-next-line require-await
        data.forEach(async (el) => ProtocolPares(el));
      }
      break;
    // 透传运行数据上传接口
    case "RunData":
      {
        const { NodeInfo, TcpServer } = body;
        console.log({ ...TcpServer });

        NodeRunInfo.updateOne(
          { NodeName: TcpServer.NodeName },
          { $set: { ...TcpServer, ...NodeInfo } },
          { upsert: true }
        )
          .then((res) => console.log(res))
          .catch((e) => console.log(e));
      }
      break;

    default:
      break;
  }
};
