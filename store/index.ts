import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { Context } from "@nuxt/types"
import { WebInfo, getInstance } from "./DB"
import { BvToast } from 'bootstrap-vue'

// 获取state返回值类型
export type RootState = ReturnType<typeof state>


export const state = () => ({
  // 设备协议单位解析缓存
  unitCache: new Map() as Map<string, Map<string, string>>,
  Info: {
    time: new Date().toLocaleString(),
    msg: "default message",
    type: "SYS"
  } as WebInfo,
  Infos: [] as WebInfo[],
  SysInfos: [] as Uart.nodeInfo[],
  BindDevice: {
    UTs: [],
    ECs: []
  }
})

export const getters: GetterTree<RootState, RootState> = {
  // 
  getUnit: state => (query: Uart.queryResultArgument) => {

    const value: Uart.queryResultArgument = Object.assign({ issimulate: false }, query)
    // 检查unit是否含有“{.*}”
    if (!value.unit || !/^{.*}$/.test(value.unit)) value.issimulate = true
    else {
      // 检查单位-》结果缓存,如果没有则新建缓存
      if (!state.unitCache.has(value.unit)) {
        //const args: Map<string, string> = new Map()
        // "{0:关闭,1:开启}"清除字符串'{|},'space,以','分割
        const arr = value.unit.replace(/(\{|\}| )/g, "").split(",").map(el => el.split(":")) as Iterable<readonly [string, string]>
        state.unitCache.set(value.unit, new Map(arr))
      }
      // 读取缓存// 没有相应缓存则返回原始值val:0,unit:{1:open,2:close}
      value.value = <string>state.unitCache.get(value.unit)!.get(value.value)

      value.unit = ''

    }
    console.log(value);

    return value
  }
}
/* 

*/
export const mutations: MutationTree<RootState> = {
  // 更新用户绑定设备
  updateBindDev(state, payload) {
    state.BindDevice = payload
  },
  addSysInfo(state, payload) {
    state.SysInfos.push(payload)
  },
  //CHANGE_NAME: (state, newName: string) => (state.temp = newName),
  // socket vuex 绑定事件
  addInfo(state, payload: WebInfo) {
    const info: WebInfo = {
      time: new Date().toLocaleString(),
      msg: payload.msg,
      type: payload.type,
      code: 1
    };
    const deepInfo = JSON.parse(JSON.stringify(info))
    //getInstance().insert<WebInfo>({ tableName: 'Infos', data: deepInfo })
    //console.log(deepInfo);

    state.Info = info as any
    ((this as any)._vm.$bvToast as BvToast)
      .toast(payload.msg, { title: payload.type, autoHideDelay: 1000, variant: "danger", toaster: "b-toaster-bottom-left", appendToast: true })
    state.Infos.push(state.Info)
    // 超出条例清空数据
    if (state.Infos.length > 50) state.Infos = []
  }

}
/* 

*/
export const actions: ActionTree<RootState, RootState> = {
  socket_valdationSuccess(ctx, play) {
    // console.log(play);
  },
  // 其他客户端登录
  socket_login({ commit }, payload) {
    const msg = `新的设备登录,登录IP@${payload.IP},socket:@${payload.ID}`
    const info: WebInfo = {
      msg,
      type: "User"
    }
    commit("addInfo", info)
  },
  socket_logout({ commit }, payload) {
    const msg = `在线设备离线,IP@${payload.IP},socket:@${payload.ID}`
    const info: WebInfo = {
      msg,
      type: "User"
    }
    commit("addInfo", info)
  },
  socket_UartTerminalDataTransfinite({ commit }, payload) {
    const info: WebInfo = {
      msg: payload,
      type: 'UT'
    }
    commit("addInfo", info)
  }
}