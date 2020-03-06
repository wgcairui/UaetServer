import { ApolloServer } from "apollo-server-koa";
import { JwtVerify } from "../bin/Secret";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { KoaCtx } from "../bin/interface";

export default new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: ({ ctx }: { ctx: KoaCtx }) => {
    // 获取Token
    const token = ctx.cookies.get("auth._token.local");
    // 没有token则检查body，注册和重置页面的请求则通过
    if (token && token === "false") {
      // 获取gragpl
      const { operationName } = ctx.request.body;
      const guestQuery = ["getUser", "addUserAccont"];
      if (operationName && guestQuery.includes(operationName))
        return { user: "guest", loggedIn: false };
      else throw new Error("query error");
    }
    // 解构token
    const user = JwtVerify((<string>token).replace("bearer%20", ""));
    //
    if (!user || !user.user) throw new Error("you must be logged in");
    return { ...user, loggedIn: true, $Event: ctx.$Event };
  }
});
