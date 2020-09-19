import core from "@alicloud/pop-core"
import Event from "../event/index";
import { LogSmsSend } from "../mongoose/Log";
import { logSmsSend, smsUartAlarm, ApolloMongoResult, queryResult, TerminalMountDevs } from "uart";
import { getDtuInfo } from "./util";
const key = require("../key/aliSms.json")

interface SmsResult {
    "Message": string
    "RequestId": string
    "BizId": string
    "Code": string
}
interface params {
    RegionId: string;
    PhoneNumbers: string;
    SignName: string;
    TemplateCode: string;
    TemplateParam: string;
}

// 阿里云SMS文档
// https://api.aliyun.com/?spm=a2c4g.11186623.2.21.79af50a4cYSUsg#/?product=Dysmsapi&version=2017-05-25&api=AddSmsSign&params={%22RegionId%22:%22default%22}&tab=DEMO&lang=NODEJS

const client = new core(
    {
        accessKeyId: key.accessKeyId,
        accessKeySecret: key.accessKeySecret,
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
    }
)
// 发送告警短信
export const SendUartAlarm = async (query: smsUartAlarm) => {
    const smsCode = {
        透传设备下线提醒: "SMS_189710812",
        透传设备上线提醒: "SMS_189710830",
        透传设备告警: 'SMS_189710878'
    }
    // 时间参数,长度限制20字节
    const time = new Date()
    const d = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
    // 构建请求对象
    const queryObject = query.type === "透传设备告警"
        ? { name: query.name, devname: query.devname, air: query.air, event: query.event, time: d }
        : { name: query.name, devname: query.devname, time: d }
    const TemplateParam = JSON.stringify(queryObject)
    const params: params = {
        "RegionId": "cn-hangzhou",
        "PhoneNumbers": query.tel,
        "SignName": "雷迪司科技湖北有限公司",
        "TemplateCode": smsCode[query.type],
        TemplateParam
    }
    return SendSms(params)
}

export const SendValidation = (tel: string, code: string) => {
    if (!tel || tel.length !== 11) {
        return { ok: 0, msg: `电话号码错误,${tel}` } as ApolloMongoResult
    }
    const TemplateParam = JSON.stringify({ code })
    const params: params = {
        "RegionId": "cn-hangzhou",
        "PhoneNumbers": tel,
        "SignName": "雷迪司科技湖北有限公司",
        "TemplateCode": "SMS_190275627",
        TemplateParam
    }
    return SendSms(params)
}

// 发送短信
const SendSms = async (params: params): Promise<Partial<ApolloMongoResult>> => {
    const CacheAlarmSendNum = Event.Cache.CacheAlarmSendNum
    //const tels = params.PhoneNumbers.split(",")
    // 迭代发送的手机号码,检查号码每天的发送次数,每个号码每天限额50
    const tels = params.PhoneNumbers.split(",").filter(el => !CacheAlarmSendNum.has(el) || CacheAlarmSendNum.get(el) as number < 51)
    params.PhoneNumbers = tels.join(',')
    if (!params.PhoneNumbers) return { ok: 0, msg: "all tels Sending messages in excess of the number 50 " }
    // console.log(params);
    const result = await client.request<SmsResult>('SendSms', params, { method: 'POST' }).then(el => {
        const data: logSmsSend = {
            tels,
            sendParams: params,
            Success: el
        }
        new LogSmsSend(data).save()
        return { ok: 1, msg: "send Success" }
    }).catch(e => {
        const data: logSmsSend = {
            tels,
            sendParams: params,
            Error: e
        }
        new LogSmsSend(data).save()
        return { ok: 0, msg: "send Error", arg: e }
    })
    // 如果发送成功,号码发送次数+1
    if (result.ok && params.TemplateCode !== 'SMS_190275627') {
        tels.forEach(tel => {
            const n = CacheAlarmSendNum.get(tel)
            CacheAlarmSendNum.set(tel, n ? n + 1 : 1)
        })
    }
    return result
}

// 发送设备超时下线
export const SmsDTUDevTimeOut = (Query: queryResult, event: '超时' | '恢复') => {
    const info = getDtuInfo(Query.mac)
    if (info && info.userInfo.tels?.length > 0) {
        // 时间参数,长度限制20字节
        const time = new Date()
        const d = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
        const TemplateParam = JSON.stringify({
            name: info.user.name || info.user.user,
            DTU: info.terminalInfo.name,
            pid: Query.pid,
            devname: Query.mountDev,
            time: d,
            event
        })
        const params: params = {
            "RegionId": "cn-hangzhou",
            "PhoneNumbers": info.userInfo.tels.join(','),
            "SignName": "雷迪司科技湖北有限公司",
            "TemplateCode": 'SMS_200701321',
            TemplateParam
        }
        return SendSms(params)
    } else return false
}

// 发送DTU挂载设备告警
export const SmsDTUDevAlarm = (Query: queryResult, remind: string) => {
    const info = getDtuInfo(Query.mac)
    if (info && info.userInfo.tels?.length > 0) {
        // 时间参数,长度限制20字节
        const time = new Date()
        const d = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
        const TemplateParam = JSON.stringify({
            name: info.user.name,
            DTU: info.terminalInfo.name,
            pid: Query.pid,
            devname: Query.mountDev,
            time: d,
            remind
        })
        const params: params = {
            "RegionId": "cn-hangzhou",
            "PhoneNumbers": info.userInfo.tels.join(','),
            "SignName": "雷迪司科技湖北有限公司",
            "TemplateCode": 'SMS_200701342',
            TemplateParam
        }
        return SendSms(params)
    } else return false
}

// 发送设备超时下线
export const SmsDTU = (mac: string, event: '恢复上线' | '离线') => {
    const info = getDtuInfo(mac)
    if (info && info.userInfo?.tels?.length && info.userInfo?.tels?.length > 0) {
        // 时间参数,长度限制20字节
        const time = new Date()
        const d = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
        const TemplateParam = JSON.stringify({
            name: info.user.name,
            DTU: info.terminalInfo.name,
            time: d,
            remind: event
        })
        console.log({
            msg: 'senSmsDtu' + event,
            tels: info.userInfo.tels,
            TemplateParam
        });

        const params: params = {
            "RegionId": "cn-hangzhou",
            "PhoneNumbers": info.userInfo.tels.filter(el=>el).join(','),
            "SignName": "雷迪司科技湖北有限公司",
            "TemplateCode": 'SMS_200691431',
            TemplateParam
        }
        return SendSms(params).then(el => {
            console.log(el);
            return el
        })
    } else return false
}