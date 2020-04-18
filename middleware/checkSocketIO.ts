import { Context } from "@nuxt/types";

export default (ctx:Context)=>{
    const socket = ctx.app.socket as SocketIOClient.Socket
    if(socket.disconnected){
        const token = localStorage.getItem("auth._token.local")
        socket.io.opts.query = {token}
        console.log({token,query:socket.io.opts.query});
         socket.io.open()
}}