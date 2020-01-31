import { mongoose, Schema } from "./index";

const SchemaTerminal = new Schema({
  DevMac: { type: String, required: true },
  name: { type: String, required: true },
  Jw: String,
  mountNode: { type: String, required: true },
  mountDevs: [
    new Schema({
      _id: {type:Boolean,default:false},
      mountDev: { type: String, required: true },
      protocol: { type: String, required: true },
      pid: { type: Number, default: 0 }
    })
  ]
});

const Terminal = mongoose.model("Terminal", SchemaTerminal);

export { Terminal };
