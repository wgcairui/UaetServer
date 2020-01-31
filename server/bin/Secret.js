"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* jshint esversion:8 */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.secret = "UartServer";
exports.tokenExpiresTime = 1000 * 60 * 60 * 24;
/**
 *加密函数
 *payload为加密的数据，数据类型string or object
 * @param {*} { payload, option }
 * @returns
 */
exports.JwtSign = ({ payload, option = {} }) => {
    const opt = Object.assign({ expiresIn: exports.tokenExpiresTime }, option || {});
    return jsonwebtoken_1.default.sign(payload, exports.secret, opt);
};
/**
 *解密函数
 *
 * @param {*} { token }
 * @returns
 */
exports.JwtVerify = (token) => {
    return jsonwebtoken_1.default.verify(token, exports.secret);
};
