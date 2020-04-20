import Vue from "vue"
import SocketState from "../components/SocketState.vue"
import separated from "../components/separated.vue"
import MyHead from "../components/MyHead.vue"
import MyPage from "../components/MyPage.vue"

Vue.component('my-page',MyPage)
Vue.component('socket-state',SocketState)
Vue.component('my-head',MyHead)
Vue.component('separated',separated)