/* eslint-disable no-console */
/* jshint esversion:8 */
const mongoose = require("mongoose");
const DB_URL = "mongodb://localhost:27017/UartServer"; /** * 连接 */
const Schema = mongoose.Schema;

mongoose.connect(DB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
}); /** * 连接成功 */
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.connection.on("connected", function() {
  console.log("Mongoose connection open to " + DB_URL);
}); /** * 连接异常 */

mongoose.connection.on("error", function(err) {
  console.log("Mongoose connection error: " + err);
}); /** * 连接断开 */

mongoose.connection.on("disconnected", function() {
  console.log("Mongoose connection disconnected");
});

module.exports = { mongoose, Schema };
