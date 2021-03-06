import { createTransport } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { LogMailSend } from "../mongoose";


const key = require("../key/qqMail.json");

let transporter = createTransport({
    // host: 'smtp.ethereal.email',
    service: "QQ", // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
    /* port: 465, // SMTP 端口
    secureConnection: true, // 使用了 SSL */
    auth: {
        user: key.user,
        // 这里密码不是qq密码，是你设置的smtp授权码
        pass: key.pass,
    },

});

/**
 *
 *
 * @param {*} mail 接受邮箱
 * @param {*} title 标题
 * @param {*} subject 主题
 * @param {*} body  校验码
 * @returns
 */
export const Send = async (mail: string, title: string, subject: string, body: string) => {
    body = String(body);
    title = title || "Ladis";
    if (title == "注册") body = `注册验证码：<strong>${body}</strong>`;
    if (title == "重置密码") body = `重置验证码：<strong>${body}</strong>`;
    subject = subject ? subject + title : "test";
    let mailOptions = {
        from: `"${title}" <${key.user}>`, // sender address
        to: mail, // list of receivers
        subject, // Subject line
        html: body // 发送text或者html格式 // text: 'Hello world?', // plain text body
    };

    return await new Promise<SMTPTransport.SentMessageInfo>((res, rej) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) rej(error);
            res(info);
        });
    }).then(el => {
        const data: Uart.logMailSend = {
            mails: mail.split(","),
            sendParams: mailOptions,
            Success: el as any
        }
        new LogMailSend(data).save()
        return data
    }).catch(e => {
        const data: Uart.logMailSend = {
            mails: mail.split(","),
            sendParams: mailOptions,
            Error: e.response
        }
        new LogMailSend(data).save()
        return data
    })


};

/**
 * 发送邮箱验证码
 * @param mail 邮箱
 * @param code 验证码
 */
export const SendValidation = async (mail: string, code: string) => {
    const title = "Ladis"
    return await Send(mail, title, "验证码", code)
}
/* export const SendMailAlarm = async (mail: string[], body: string) => {
    return await Send(mail.join(","), "Ladis透传平台", "透传设备告警事件", body)
} */