"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/* jshint esversion:8 */
const mongoose_1 = __importStar(require("mongoose"));
exports.mongoose = mongoose_1.default;
exports.Schema = mongoose_1.Schema;
const DB_URL = "mongodb://localhost:27017/UartServer"; /** * 连接 */
mongoose_1.default.connect(DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
}); /** * 连接成功 */
mongoose_1.default.set("useUnifiedTopology", true);
mongoose_1.default.set("useFindAndModify", false);
mongoose_1.default.connection
    .on("connected", function () {
    console.log("Mongoose connection open to " + DB_URL);
})
    .on("error", function (err) {
    console.log("Mongoose connection error: " + err);
})
    .on("disconnected", function () {
    console.log("Mongoose connection disconnected");
});
