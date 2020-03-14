import Vue from "vue"
import io from "socket.io-client"
import VueSocketIOExt from "vue-socket.io-extended"

export default ctx => {
  // 注册socket
  const token = localStorage.getItem("auth._token.local")

  const socket = io("http://www.ladishb.com:9010", {
    path: "/WebClient",
    query: { token }
  })
  Vue.use(VueSocketIOExt, socket, { store: ctx.store })
}
