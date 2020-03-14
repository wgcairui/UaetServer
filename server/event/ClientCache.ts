
export default class ClientCache {
    // 网站用户-> socketID[]
    CacheUserSocketids: Map<string, Set<string>>
    // socketID->user
    CacheSocketidUser:Map<string,string>
    constructor() {
        this.CacheUserSocketids = new Map()
        this.CacheSocketidUser = new Map()
    }
}