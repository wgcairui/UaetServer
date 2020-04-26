import Vue from "vue"
import VeLine from "v-charts/lib/line.common"
import SocketState from "../components/SocketState.vue"
import separated from "../components/separated.vue"
import MyHead from "../components/MyHead.vue"
import MyPage from "../components/MyPage.vue"
import OprateModal from "../components/OprateModal.vue"

Vue.component("oprate-modal", OprateModal)
Vue.component("my-page", MyPage)
Vue.component("socket-state", SocketState)
Vue.component("my-head", MyHead)
Vue.component("separated", separated)
Vue.component("ve-line", VeLine)
