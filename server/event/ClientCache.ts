
export default class ClientCache {
    // 缓存客户校验码token=>code
    CacheUserValidationCode: Map<string, string>
    // 用户权限缓存user=>token
    CacheUserJurisdiction: Map<string, string>
    // 客户登陆hash
    CacheUserLoginHash: Map<string, string>
    // 网站用户-> socketID[]
    CacheUserSocketids: Map<string, Set<string>>
    // socketID->user
    CacheSocketidUser: Map<string, string>
    // 微信登录seesion
    CacheWXSession: Map<string, string | null>
    // 扫二维码登录缓存编码和token
    CacheQR: Map<string, string>
    constructor() {
        this.CacheUserValidationCode = new Map()
        this.CacheUserJurisdiction = new Map()
        this.CacheUserLoginHash = new Map()
        this.CacheUserSocketids = new Map()
        this.CacheSocketidUser = new Map()
        this.CacheWXSession = new Map()
        this.CacheQR = new Map()
    }
}