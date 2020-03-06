import { GetterTree, ActionTree, MutationTree } from 'vuex'

const unitCache: Map<string, Map<string, string>> = new Map()

export const state = () => ({
  unitCache,
  temp: ""
})

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {
  name: state => state.temp,
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

export const mutations: MutationTree<RootState> = {
  CHANGE_NAME: (state, newName: string) => (state.temp = newName),
}

export const actions: ActionTree<RootState, RootState> = {
  fetchThings({ commit }) {
    commit('CHANGE_NAME', 'New name')
  },
}