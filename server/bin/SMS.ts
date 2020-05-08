import core from "@alicloud/pop-core"
const key = require("../key/aliSms.json")

interface SmsResult {
    "Message": string
    "RequestId": string
    "BizId": string
    "Code": string
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

const requestOption = {
    method: 'POST'
};

// 单条发送短信
type UartAlarmType = "透传设备下线提醒" | "透传设备上线提醒" | '透传设备告警'
interface UartAlarm {
    tel: string
    name: string
    devname: string
    air?: string
    event?: string
    type: UartAlarmType
}
export const SendUartAlarm = async (query: UartAlarm) => {
    const smsCode = {
        透传设备下线提醒: "SMS_189710812",
        透传设备上线提醒: "SMS_189710830",
        透传设备告警: 'SMS_189710878'
    }
    // 时间参数,长度限制20字节
    let time = new Date()
    const d = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
    // 构建请求对象
    const queryObject = query.type === "透传设备告警"
        ? { name: query.name, devname: query.devname, air: query.air, event: query.event, time: d }
        : { name: query.name, devname: query.devname, time: d }
    const TemplateParam = JSON.stringify(queryObject)
    const params = {
        "RegionId": "cn-hangzhou",
        "PhoneNumbers": query.tel,
        "SignName": "雷迪司科技湖北有限公司",
        "TemplateCode": smsCode[query.type],
        TemplateParam
    }
    console.log(params);
    
    const result: SmsResult = await client.request('SendSms', params, requestOption).then(el => {
        return el as any
    }).catch(e => {
        return e
    })
    console.log(result);
    if (result.Code === "OK") {
        return true
    } else {
        console.log(result);
        return false
    } 
}
