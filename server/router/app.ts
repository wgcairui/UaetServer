/* app端用api */
import { ParameterizedContext } from "koa";
import { JwtVerify } from "../util/Secret";
import { UserInfo, KoaCtx, ApolloMongoResult } from "../bin/interface";
import { RegisterTerminal, Terminal } from "../mongoose/Terminal";
export default async (Ctx: ParameterizedContext) => {
  const ctx: KoaCtx = Ctx as any;
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body;
  const type = ctx.params.type;
  // 所有的请求都需要检查token，没有token返回err
  ctx.assert(body.token, 400, "no token");
  const user: UserInfo = await JwtVerify(body.token).catch(err =>
    ctx.throw(401)
  );
  // console.log({ token: body, user, type });
  switch (type) {
    case "nodes":
      const nodes = Array.from(ctx.$Event.Cache.CacheNodeName.keys());
      ctx.body = { nodes };
      break;
    case "registerTerminal":
      const { node, codes }: { node: string; codes: string[] } = body;
      ctx.assert(node || codes, 400, "参数错误");
      //
      const resut = codes.map(async el => {
        if (ctx.$Event.Cache.CacheTerminal.has(el)) {
          return el + "重复注册\n";
        } else {
          await new RegisterTerminal({ DevMac: el, mountNode: node }).save();
          await Terminal.updateOne(
            { DevMac: el },
            { $set: { mountNode: node, name: el } },
            { upsert: true }
          ).exec();
          await ctx.$Event.Cache.RefreshCacheTerminal(el);
          return el + "注册成功\n";
        }
      });
      const msg = await Promise.all(resut);
      ctx.body = { msg: msg.join(""), ok: 1 } as ApolloMongoResult;
      break;
  }
};
