import Vue from "vue"
import io from "socket.io-client"
import VueSocketIOExt from "vue-socket.io-extended"

export default ctx => {
  console.log(Object.keys(ctx))
  // 注册socket
  // const token = ctx.$auth.getToken("local")
  const socket = io("http://localhost:9010", {
    path: "/WebClient",
    query: { token: "ss 16515" }
  })
  Vue.use(VueSocketIOExt, socket, { store: ctx.store })
}
