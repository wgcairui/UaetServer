import { mongoose, Schema } from "./index";

const SchemaRegisterTerminal = new Schema({
  DevMac: { type: String, required: true },
  mountNode: { type: String, required: true },
})

const SchemaTerminal = new Schema({
  DevMac: { type: String, required: true },
  name: { type: String, required: true },
  Jw: String,
  mountNode: { type: String, required: true },
  mountDevs: [
    new Schema(
      {
        Type: { type: String, required: true },
        mountDev: { type: String, required: true },
        protocol: { type: String, required: true },
        pid: { type: Number, default: 0 }
      },
      { _id: false }
    )
  ]
});

export const Terminal = mongoose.model("Terminal", SchemaTerminal);

export const RegisterTerminal = mongoose.model("RegisterTerminal", SchemaRegisterTerminal)
