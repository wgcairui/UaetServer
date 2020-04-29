import Vue from "vue"
import VeLine from "v-charts/lib/line.common"
import SocketState from "../components/SocketState.vue"
import separated from "../components/separated.vue"
import MyHead from "../components/MyHead.vue"
import MyPage from "../components/MyPage.vue"
import OprateModal from "../components/OprateModal.vue"
import DevTable from "../components/DevTable.vue"
import MyForm from "../components/MyForm.vue"
import MyOprate from "../components/MyOprate.vue"

Vue.component("my-oprate", MyOprate)
Vue.component("my-form", MyForm)
Vue.component("dev-table", DevTable)
Vue.component("oprate-modal", OprateModal)
Vue.component("my-page", MyPage)
Vue.component("socket-state", SocketState)
Vue.component("my-head", MyHead)
Vue.component("separated", separated)
Vue.component("ve-line", VeLine)
