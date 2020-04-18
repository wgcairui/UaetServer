import { GetterTree, ActionTree, MutationTree } from 'vuex'
import {Context} from "@nuxt/types"

export type RootState = ReturnType<typeof state>

type InfoType = "User" | "EC" | "UT" | "SYS"

export interface WebInfo {
  time?: string
  msg: string
  code?: number
  type: InfoType
}

export const state = () => ({
  // 设备协议单位解析缓存
  unitCache:new Map() as Map<string, Map<string, string>>,
  Info:{
    time: new Date().toLocaleString(),
    msg: "default message",
    type: "SYS"
  } as WebInfo,
  Infos:[] as WebInfo[]
})

export const getters: GetterTree<RootState, RootState> = {
  // 
  getUnit: state => (val: string, unitString: string) => {
    // 检查unit是否含有“{”
    let result = { value: "", unit: true }
    if (!unitString.includes("{")) {
      result.value = val + unitString
    } else {
      // 检查单位-》结果缓存,如果没有则新建缓存
      if (!state.unitCache.has(unitString)) {
        // Map缓存单位字符串-》单位json
        let args: Map<string, string> = new Map()
        // "{0:关闭,1:开启}"清除字符串'{,},'space,以','分割
        const unitArray = unitString.replace(/\{/, "").replace(/\}/, "").trim().split(",")
        // 缓存到arg Map
        unitArray.forEach(el => {
          const [key, value] = el.split(":")
          args.set(key, value)
        })
        //
        state.unitCache.set(unitString, args)
      }
      // 读取缓存
      const unitCache = <string>state.unitCache.get(unitString)?.get(String(val))
      result.unit = false
      // 没有相应缓存则返回原始值val:0,unit:{1:open,2:close}
      result.value = unitCache || val + unitString
    }
    return result
  }
}
/* 

*/
export const mutations: MutationTree<RootState> = {
  //CHANGE_NAME: (state, newName: string) => (state.temp = newName),
  // socket vuex 绑定事件
  addInfo(state, payload: WebInfo) {
    state.Info = {
      time: new Date().toLocaleString(),
      msg: payload.msg,
      type: payload.type,
      code: 1
    }
    state.Infos.push(state.Info)
  }

}
/* 

*/
export const actions: ActionTree<RootState, RootState> = {
  //fetchThings({ commit }) { commit('CHANGE_NAME', 'New name') },
  // socket绑定事件
  // sock登录效验success
  socket_valdationSuccess(ctx, play) {
    //console.log(play);
  },
  // 其他客户端登录
  socket_login({ commit }, payload) {
    const msg = `新的设备登录,登录IP@${payload.IP},socket:@${payload.ID}`
    const info: WebInfo = {
      msg,
      type: "User"
    }
    console.log({tt:this});
    
    commit("addInfo", info)
  },
  socket_logout({ commit}, payload) {
    const msg = `在线设备离线,IP@${payload.IP},socket:@${payload.ID}`
    const info: WebInfo = {
      msg,
      type: "User"
    }
    commit("addInfo", info)
  }
}