import Vue from "vue"
import VeLine from "v-charts/lib/line.common"
import SocketState from "../components/SocketState.vue"
import separated from "../components/separated.vue"
import MyHead from "../components/MyHead.vue"
import MyPageUser from "../components/my-page-user.vue"
import MyPageUserDev from "../components/my-page-user-dev.vue"
import MyPageManage from "../components/my-page-manage.vue"
import MyForm from "../components/MyForm.vue"
import MyOprate from "../components/MyOprate.vue"

import SmsValidation from "../components/SmsValidation.vue"

Vue.component("sms-validation", SmsValidation)

Vue.component("my-oprate", MyOprate)
Vue.component("my-form", MyForm)
Vue.component("my-page-user", MyPageUser)
Vue.component("my-page-user-dev", MyPageUserDev)
Vue.component("my-page-manage", MyPageManage)

Vue.component("socket-state", SocketState)
Vue.component("my-head", MyHead)
Vue.component("separated", separated)
Vue.component("ve-line", VeLine)
