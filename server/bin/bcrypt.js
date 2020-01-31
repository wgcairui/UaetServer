"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 10;
exports.BcryptDo = (passwd) => {
    return new Promise((resolve, reject) => {
        bcrypt_1.default.genSalt(saltRounds, (err, salt) => {
            if (err)
                reject(err);
            bcrypt_1.default.hash(passwd, salt, (err, hash) => {
                if (err)
                    reject(err);
                resolve(hash);
            });
        });
    });
};
exports.BcryptCompare = (passwd, hash) => {
    return new Promise((resolve, reject) => {
        bcrypt_1.default.compare(passwd, hash, (err, some) => {
            if (err)
                reject(err);
            resolve(some);
        });
    });
};
