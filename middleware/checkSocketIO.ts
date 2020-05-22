import { Context } from "@nuxt/types";

export default (ctx: Context) => {
    // 判断是否是IE
    (function isIE(){
        if("ActiveXObject" in window){
            console.log('正在使用IE登陆');
            alert('本网站不支持IE浏览器,请切换至chrome,edge,firefox,safari浏览器.')
        }
    })()

    const socket = ctx.app.$socket as SocketIOClient.Socket

    if (socket.disconnected) {
        const token = localStorage.getItem("auth._token.local")
        if (token !== 'false' && Boolean(token)) {
            socket.io.opts.query = { token }
            socket.io.opts.autoConnect = true
            // console.log({ token, query: socket.io.opts.query ,socket});
            // 注册vuex事件
            {
                const store = ctx.store
                const actionsEvent = Object.keys((store as any)._actions).filter(el => /socket/i.exec(el)).map(el => el.replace(/socket_/i, ''))
                const mutationsEvent = Object.keys((store as any)._mutations).filter(el => /socket/i.exec(el)).map(el => el.replace(/socket_/i, ''))
                actionsEvent.forEach(el => {
                    socket.on(el, (data: any) => {
                        store.dispatch('socket_' + el, data)
                    })
                })
                mutationsEvent.forEach(el => {
                    socket.on(el, (data: any) => {
                        store.commit('SOCKET_' + el, data)
                    })
                })
            }
            socket.open()
        }

    }
}