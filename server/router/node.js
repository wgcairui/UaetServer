/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const { NodeRunInfo } = require("../mongoose/node");
const ProtocolPares = require("../bin/ProtocolPares");
module.exports = async (ctx, next) => {
  const type = ctx.params.type;
  const body = ctx.request.body;
  switch (type) {
    case "UartData":
      {
        const { data } = body;
        console.log(data);

        // eslint-disable-next-line require-await
        data.forEach(async (el) => ProtocolPares(el));
      }
      break;
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
  await next();
};
