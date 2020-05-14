
export default class ClientCache {
    // 客户登陆hash
    CacheUserLoginHash:Map<string,string>
    // 网站用户-> socketID[]
    CacheUserSocketids: Map<string, Set<string>>
    // socketID->user
    CacheSocketidUser:Map<string,string>
    constructor() {
        this.CacheUserLoginHash = new Map()
        this.CacheUserSocketids = new Map()
        this.CacheSocketidUser = new Map()
    }
}