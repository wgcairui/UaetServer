import core from "@alicloud/pop-core"
import { LogSmsSend } from "../mongoose/Log";
import { logSmsSend, smsUartAlarm, ApolloMongoResult } from "../bin/interface";
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
    const TemplateParam = JSON.stringify({code})
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
const SendSms = async (params: params):Promise<Partial<ApolloMongoResult>> => {
    // console.log(params);
    return await client.request('SendSms', params, { method: 'POST' }).then(el => {
        const data: logSmsSend = {
            query: params.TemplateParam,
            sendParams: params,
            Success: el as any
        }
        new LogSmsSend(data).save()
        return {ok:1,msg:"send success"}
    }).catch(e => {
        const data: logSmsSend = {
            query: params.TemplateParam,
            sendParams: params,
            Success: e as any
        }
        new LogSmsSend(data).save()
        return {ok:0,msg:"send error",arg:e}
    })
}