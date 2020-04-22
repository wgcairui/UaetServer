import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { Context } from "@nuxt/types"
import { WebInfo, getInstance } from "./DB"
import { queryResultArgument } from '../server/bin/interface'

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
  Infos: [] as WebInfo[]
})

export const getters: GetterTree<RootState, RootState> = {
  // 
  getUnit: state => (query:queryResultArgument) => {
    const value:queryResultArgument = Object.assign({issimulate:false},query)
    // 检查unit是否含有“{”
    if (!value.unit?.includes("{")) {
      value.issimulate = true
      return value
    } else {
      // 检查单位-》结果缓存,如果没有则新建缓存
      if (!state.unitCache.has(value.unit)) {
        // Map缓存单位字符串-》单位json
        const args: Map<string, string> = new Map()
        // "{0:关闭,1:开启}"清除字符串'{,},'space,以','分割
        const unitArray = value.unit.replace(/(\{|\}| )/g, "").split(",")
        // 缓存到arg Map
        unitArray.forEach(el => {
          const [key, value] = el.split(":")
          args.set(key, value)
        })
        //
        state.unitCache.set(value.unit, args)
      }
      // 读取缓存
      const unitCache = <string>state.unitCache.get(value.unit)?.get(value.value)
      // 没有相应缓存则返回原始值val:0,unit:{1:open,2:close}
        value.value = unitCache || value.value+value.unit
        return value     
    }    
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
    };
    (this as any)._vm.$bvToast.toast(payload.msg, { title: payload.type })
    state.Infos.push(state.Info)
    console.log(state);
    getInstance().insert<WebInfo>({tableName:'Infos',data:state.Info})

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
  }
}