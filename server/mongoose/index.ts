import mongoose, { Schema } from "mongoose";
const DB_URL: string = "mongodb://localhost:27017/UartServer"; /** * 连接 */

export { mongoose, Schema };

mongoose.connect(DB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
}); /** * 连接成功 */
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.connection
  .on("connected", function() {
    console.log("Mongoose connection open to " + DB_URL);
  })
  .on("error", function(err) {
    console.log("Mongoose connection error: " + err);
  })
  .on("disconnected", function() {
    console.log("Mongoose connection disconnected");
  });
