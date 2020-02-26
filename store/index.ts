import { GetterTree, ActionTree, MutationTree } from 'vuex'

const unitCache: Map<string, Map<string, string>> = new Map()

export const state = () => ({
  unitCache,
  temp: ""
})

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {
  name: state => state.temp,
  getUnit: state => (unitString: string) => {
    if (!state.unitCache.has(unitString)) {
      let args: Map<string, string> = new Map()
      unitString.replace(/\{/, "").replace(/\}/, "").trim().split(",").map(el => {
        let arg = el.split(":")
        args.set(arg[0], arg[1])
      })
      state.unitCache.set(unitString, args)
    }
    return state.unitCache.get(unitString)
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