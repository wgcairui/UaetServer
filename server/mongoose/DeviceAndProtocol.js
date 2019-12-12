const { mongoose, Schema } = require("./index");

const SchemaDev = new Schema({
  Type: String
});

export const DevProtocol = mongoose.model("DeviceProtocol", SchemaDev);
