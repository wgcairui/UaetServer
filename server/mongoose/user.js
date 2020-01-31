"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable camelcase */
/* jshint esversion:8 */
const index_1 = require("./index");
const Schema_Users = new index_1.Schema({
    userId: String,
    name: String,
    user: { type: String, index: true, trim: true, required: true, unique: true },
    userGroup: {
        type: String,
        enum: ["root", "admin", "user"],
        trim: true,
        default: "user"
    },
    passwd: String,
    mail: String,
    company: String,
    tel: Number,
    creatTime: { type: Date, default: new Date() },
    modifyTime: { type: Date, default: null },
    address: String,
    status: { type: Boolean, default: true },
    messageId: String,
});
const SchemaUserBindDevice = new index_1.Schema({
    user: String,
    ECs: [String],
    UTs: [String]
});
const Users = index_1.mongoose.model("users", Schema_Users);
exports.Users = Users;
const UserBindDevice = index_1.mongoose.model("UserBindDevice", SchemaUserBindDevice);
exports.UserBindDevice = UserBindDevice;
