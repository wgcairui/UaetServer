"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const Secret_1 = require("../bin/Secret");
const bcrypt_1 = require("../bin/bcrypt");
const user_1 = require("../mongoose/user");
exports.default = async (ctx) => {
    const type = ctx.params.type;
    const body = ctx.request.body;
    switch (type) {
        case "login":
            const { user, passwd } = body;
            const u = await user_1.Users.findOne({ $or: [{ user }, { mail: user }] }).lean();
            ctx.assert(u, 400, "userNan");
            const pwStat = await bcrypt_1.BcryptCompare(passwd, u.passwd);
            console.log(pwStat);
            ctx.assert(pwStat, 400, "passwdError");
            // if (!BcryptCompare(passwd, u.passwd)) ctx.throw(400, "passwdError");
            if (u && pwStat)
                ctx.body = { token: Secret_1.JwtSign({ payload: { ...u } }) };
            break;
        case "logout":
            ctx.body = await new Promise((resolve) => {
                resolve({ state: "logout success" });
            });
            break;
        default:
            break;
    }
};
