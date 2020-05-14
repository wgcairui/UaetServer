import { ApolloServer } from "apollo-server-koa";
import { GraphQLRequest } from "apollo-server-types";
import { JwtVerify } from "../bin/Secret";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { KoaCtx, UserInfo, logUserRequst } from "../bin/interface";
import { LogUserRequst } from "../mongoose/Log";

export default new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: async ({ ctx }: { ctx: KoaCtx }) => {
    // 获取Token
    const token = ctx.cookies.get("auth._token.local");
    const apolloRequest = ctx.request.body as GraphQLRequest
    // 没有token则检查body，注册和重置页面的请求则通过
    if (!token || token === "false") {
      const guestQuery = ["getUser", "addUserAccont"];
      if (guestQuery.includes(apolloRequest.operationName || ''))
        return { user: "guest", loggedIn: false };
      else throw new Error("query error");
    }
    // 解构token
    const user: UserInfo = await JwtVerify((<string>token).replace(/^bearer\%20/, ""));
    // token不合法则报错
    if (!user || !user.user) throw new Error("you must be logged in");
    // 保存所有的操作日志
    new LogUserRequst({ user: user.user, userGroup: user.userGroup, type: apolloRequest.operationName, argument: apolloRequest.variables } as logUserRequst).save()
    return { ...user, loggedIn: true, $Event: ctx.$Event, $SocketUart: ctx.$SocketUart,$token:token};
  }
});
