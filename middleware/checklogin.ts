import { Context } from "@nuxt/types";
import * as uni from "../plugins/uni.webview.1.5.2";
export default async (ctx: Context) => {
    const token = ctx.route.query.token as string
    console.log({token});
    
    if (token) {
        await ctx.$auth.setUserToken(token)
        if (ctx.$auth.loggedIn) ctx.redirect(1, '/')
    } else {
        uni.getEnv(function (res: any) {
            uni.navigateTo({
                url: "/pages/login/login"
            });
        });
    }
}
