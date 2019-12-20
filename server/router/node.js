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
        NodeRunInfo.updateOne(
          { NodeName: TcpServer.NodeName },
          { $set: { ...TcpServer, ...NodeInfo } },
          { upsert: true }
        );
      }
      break;

    default:
      break;
  }
  await next();
};
