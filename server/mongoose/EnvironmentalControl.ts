import { mongoose, Schema } from "./index";

const SchemaEC = new Schema({
  ECid: String,
  name: String,
  model: String
});

const EcTerminal = mongoose.model("EcTerminal", SchemaEC);

export { EcTerminal };
