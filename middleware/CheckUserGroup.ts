import { Context } from "@nuxt/types"
export default async (ctx: Context) => {
  const { userGroup } = await ctx.$axios.$get("/api/auth/userGroup")
  // console.log({ ctx, userGroup })
  const path = ctx.route.path
  if (/(^\/user\/*)/.test(path) || /^\/login/.test(path)) return
  // 如果普通用户路径不再/main下,则跳转到/main
  if (userGroup === 'user' && !/^\/main\/*/.test(path)) {
    ctx.redirect(303, "/main")
  }

  if (userGroup === 'root' && !/^\/root\/*/.test(path)) {
    ctx.redirect(303, "/root")
  }

  if (userGroup === 'admin' && !/^\/admin\/*/.test(path)) {
    ctx.redirect(303, "/admin")
  }

  if (!userGroup || userGroup === 'guest') {
    ctx.redirect(303, "/login")
  }
}
