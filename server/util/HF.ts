/**
 * @class HF IOT server 工具
 * 
 */

import axios from 'axios'


const hfUser = require("../key/hf.json")

interface hfRequst {
    message: string
    result: number
}

interface hf_loginRequst extends hfRequst {
    data: {
        accessToken: string,
        accessTokenExpireIn: number,
        refreshToken: string,
        refreshTokenExpireIn: number
    }
}

interface hf_macInfo {
    data: {
        content: {
            description: string
            geoLatitude: number
            geoLocation: null,
            geoLongitude: number
            hostName: string
            id: number
            latitude: number
            localIp: string
            localPort: number
            longitude: number
            mac: string
            moduleType: string
            online: boolean
            plc: null,
            protocol: number
            remoteCode: string
            time: string
            upTime: string
            userKey: string
            version: number
            wanIp: string
            wanPort: number
        }[]
        first: boolean
        last: boolean
        number: number
        numberOfElements: number
        size: number
        sort: null,
        totalElements: number
        totalPages: number
    }
}

/**
 * 汉枫IOT Server获取数据方法
 */
class HF {
    token: string
    constructor() {
        this.token = ''
    }

    /**
     * @method 获取hf登录token
     */
    private async login() {
        const url = `http://open.bridge.iotworkshop.com:8080/iotbs/api/v1/users/login?timestamp=${Date.now()}`
        const data = await axios.post<hf_loginRequst>(url, {
            password: hfUser.password,
            userName: hfUser.userName
        })

        if (data.data.result) {
            console.error('汉枫IOT Server 脚本获取token失败,详情:',data.data.message);
        } else {
            this.token = data.data.data.accessToken
            setTimeout(() => {
                this.token = ''
            }, data.data.data.accessTokenExpireIn - 10)
        }
    }

    /**
     * @method 获取iot设备列表信息
     * @param mac iotmac
     */
    async macInfo(mac: string = '') {
        const url = `http://open.bridge.iotworkshop.com:8080/iotbs/api/v1/devices/?size=10&page=0`
        const data = {
            hostName: "",
            mac,
            moduleType: "",
            online: "",
            protocol: "",
            userKey: "",
            version: "",
            wanIp: "",
        }
        return this.post<hf_macInfo>(url, data)
    }

    /**
     * @method 获取iot远程设置网页
     * @param mac iotMac
     */
    async macRemote(mac: string) {
        const macInfo = await this.macInfo(mac)
        const remoteCode = macInfo.data.content[0].remoteCode
        return `http://bridge.iotworkshop.com/ctrl/device/index.html?remote_code=${remoteCode}`
    }

    /**
     * post
     * @param url 
     * @param data 
     */
    private async post<T>(url: string, data?: any) {
        if (!this.token) {
            await this.login()
        }
        return axios.post<T>(url, data, { headers: { "Access-Token": this.token } }).then(el => el.data)
    }
}

export default new HF()
