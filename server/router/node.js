/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const { TerminalClientResult, NodeRunInfo } = require("../mongoose/node");
module.exports = async (ctx, next) => {
  const type = ctx.params.type;
  const body = ctx.request.body;
  switch (type) {
    case "UartData":
      {
        const { data } = body;
        TerminalClientResult.insertMany(data);
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
