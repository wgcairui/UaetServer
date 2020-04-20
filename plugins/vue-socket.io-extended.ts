import Vue from "vue"
import io from "socket.io-client"
// import VueSocketIOExt from "vue-socket.io-extended"
import {Context} from "@nuxt/types"

export default (ctx:Context,inject:any) => {
  const host = process.env.NODE_ENV === "production" ?"http://www.ladishb.com:9010":"http://localhost:3000"
  // 注册socket
  //const token = localStorage.getItem("auth._token.local")
  /* onst socket = io(host, {
    path: "/WebClient",
    query: { token:'' },
    // autoConnect: false
  })
  ctx.app.socket = socket
  Vue.use(VueSocketIOExt, socket, { store: ctx.store }) */
  const socket = io(host, {
    path: "/WebClient",
    query: { token:'' },
    autoConnect: false
  })
  inject('socket',socket)
}
