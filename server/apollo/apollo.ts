import { ApolloServer } from "apollo-server-koa";
import { GraphQLRequest } from "apollo-server-types";
import { JwtVerify } from "../util/Secret";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { Uart } from "typing";
/* const userOprateSet = new Set(['Protocol', 'DevType', 'DevTypes', 'Terminal', 'EcTerminals',
  'BindDevice', 'userGroup', 'UartTerminalData', 'UartTerminalDatas', 'getDevState', 'getUserSetup',
  'getUserDevConstant', 'getLogTerminal', 'getUserTel', 'Aggregation', 'Aggregations',
  'userlogterminals', 'checkDevTimeOut', 'modifyUserInfo', 'resetUserPasswd', 'resetValidationCode',
  'setUserPasswd', 'addUserTerminal', 'delUserTerminal', 'SendProcotolInstruct', 'SendProcotolInstructSet',
  'setUserSetupContact', 'setUserSetupProtocol', 'sendValidationSms', 'ValidationCode', 'addAggregation',
  'deleteAggregation', 'refreshDevTimeOut', 'confrimAlarm'])
 */
export default new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: async ({ ctx }: { ctx: Uart.KoaCtx }) => {
    // 获取Token
    const token = ctx.request.header.authorization
    const apolloRequest = ctx.request.body as GraphQLRequest
    // 没有token则检查body，注册和重置页面的请求则通过
    if (!token || token === "false") {
      if (["getUser", "addUserAccont", 'resetUserPasswd', "resetValidationCode", "setUserPasswd"].includes(apolloRequest.operationName || ''))
        return { user: "guest", loggedIn: false, $Event: ctx.$Event };
      else {
        throw new Error("query error");
      }
    }

    // 解析cookie
    const user: Uart.UserInfo = await JwtVerify(token.replace(/(^Bearer|bearer)/ig, "").trim()).catch(e => console.log(e))
    if (!user || !user.user) {
      console.log("you must be logged in");
      throw new Error("you must be logged in");
    }
    /* console.log(ctx.request.body);
    

    // 检查用户操作，如果不是用户api则报错
    if (user.userGroup === 'user' && !userOprateSet.has(apolloRequest.operationName!)) {
      console.log("user premission Error", user.userGroup, user.user, apolloRequest.operationName);
      throw new Error("user premission Error");
    } */

    // 保存所有的操作日志
    ctx.$Event.savelog<Uart.logUserRequst>('request', { user: user.user, userGroup: user.userGroup || 'group', type: apolloRequest.operationName || '', argument: apolloRequest.variables })
    return { ...user, loggedIn: true, $Event: ctx.$Event, $token: token, operationName: apolloRequest.operationName, req: ctx.request };

  }
});
