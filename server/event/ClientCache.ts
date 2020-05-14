
export default class ClientCache {
    // 用户权限缓存
    CacheUserJurisdiction:Map<string,string>
    // 客户登陆hash
    CacheUserLoginHash:Map<string,string>
    // 网站用户-> socketID[]
    CacheUserSocketids: Map<string, Set<string>>
    // socketID->user
    CacheSocketidUser:Map<string,string>
    constructor() {
        this.CacheUserJurisdiction = new Map()
        this.CacheUserLoginHash = new Map()
        this.CacheUserSocketids = new Map()
        this.CacheSocketidUser = new Map()
    }
}