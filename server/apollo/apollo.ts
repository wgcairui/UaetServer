import { ApolloServer } from "apollo-server-koa";
import { GraphQLRequest } from "apollo-server-types";
import { JwtVerify } from "../util/Secret";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { Uart } from "typing";

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
      else throw new Error("query error");
    } else {
      const user:Uart.UserInfo = await JwtVerify(token.replace(/(^Bearer|bearer)/ig, "").trim()).catch(e=>console.log(e))
      if (!user || !user.user) {
        console.log("you must be logged in");
        throw new Error("you must be logged in");
      }
      // 保存所有的操作日志
      ctx.$Event.savelog<Uart.logUserRequst>('request', { user: user.user, userGroup: user.userGroup || 'group', type: apolloRequest.operationName || '', argument: apolloRequest.variables })
      return { ...user, loggedIn: true, $Event: ctx.$Event, $SocketUart: ctx.$SocketUart, $token: token };
    }

  }
});
