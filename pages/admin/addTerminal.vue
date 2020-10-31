<template>
  <b-row>
    <b-col>
      <b-row>
        <b-col>
          <separated title="查询设备"></separated>
          <b-card>
            <b-form class="px-5">
              <b-form-group label="设备Mac:" v-bind="forGroup">
                <b-form-input
                  v-model="accont.DevMac"
                  number
                  trim
                  :state="isRegisterTerminal"
                  aria-describedby="input-live-feedback"
                />
                <b-form-invalid-feedback id="input-live-feedback">此设备Mac未注册{{ isRegisterTerminal }}</b-form-invalid-feedback>
              </b-form-group>
            </b-form>
            <b-collapse v-model="isRegisterTerminal">
              <b-form class="px-5" v-if="isRegisterTerminal">
                <b-form-group label="注册节点:" v-bind="forGroup">
                  <b-form-input v-model="accont.mountNode" disabled />
                </b-form-group>
                <b-form-group label="设备别名:" v-bind="forGroup">
                  <b-form-input v-model="accont.name" trim :disabled="Boolean(Terminal)" />
                </b-form-group>
                <b-collapse v-model="TerminalStat">
                  <b-form-group label="设备地址：" v-bind="forGroup">
                    <b-form-spinbutton
                      v-model="accont.pid"
                      min="0"
                      max="254"
                      :disabled="OprateMode === 'registerTerminalMountDev'"
                    ></b-form-spinbutton>
                  </b-form-group>
                  <b-form-group label="挂载设备类型:" v-bind="forGroup">
                    <b-form-select v-model="accont.Type" :options="Devices" />
                  </b-form-group>
                  <b-form-group label="挂载设备:" v-bind="forGroup">
                    <b-form-select v-model="accont.mountDev" :options="SelectDevtype.DevType" />
                  </b-form-group>
                  <b-form-group label="协议类型:" v-bind="forGroup">
                    <b-form-select
                      v-model="accont.protocol"
                      :options="
                        SelectDevtype.Protocols.get(accont.mountDev) || []
                      "
                    />
                  </b-form-group>
                  <b-button block @click="addTerminal()">{{ Stat }}</b-button>
                </b-collapse>
              </b-form>
            </b-collapse>
          </b-card>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-table-lite :items="TerminalItem" :fields="TerminalsFields" responsive>
            <template v-slot:cell(mountDevs)="row">
              <b-button type="link" size="sm" @click="row.toggleDetails" variant="dark">查看</b-button>
            </template>
            <template v-slot:row-details="row">
              <b-card>
                <b-table-lite
                  striped
                  borderless
                  hover
                  :items="row.item.mountDevs"
                  :fields="mountDevsFields"
                >
                  <template v-slot:cell(oprate)="row1">
                    <b-button-group>
                      <b-button size="sm" @click="delTerminalMountDev(row1.item)">删除</b-button>
                      <b-button size="sm" @click="registerTerminalMountDevMode(row1.item)">
                        {{
                        OprateMode === "registerTerminalMountDev"
                        ? "取消"
                        : "修改"
                        }}
                      </b-button>
                    </b-button-group>
                  </template>
                </b-table-lite>
              </b-card>
            </template>
            <template v-slot:cell(oprate)="row">
              <b-button-group>
                <b-button variant="info" @click="addTerminalMountDev" size="sm">
                  {{
                  OprateMode === "addTerminalMountDev"
                  ? "取消"
                  : "添加挂载设备"
                  }}
                </b-button>
                <b-button variant="danger" @click="deleteTerminal(row.item)" size="sm">删除</b-button>
              </b-button-group>
            </template>
          </b-table-lite>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
import deepmerge from "deepmerge";
type OprateMode = | "addTerminal" | "addTerminalMountDev" | "registerTerminalMountDev";
export default vue.extend({
  data() {
    const routeDevMac = this.$route.query.DevMac;
    const TerminalsFields = [
      { key: "DevMac", label: "设备编号" },
      { key: "name", label: "设备名称" },
      { key: "mountNode", label: "注册节点" },
      { key: "mountDevs", label: "挂载设备" },
      { key: "oprate", label: "操作" }
    ];
    const mountDevsFields = [
      { key: "mountDev", label: "挂载设备" },
      { key: "protocol", label: "协议" },
      "pid",
      { key: "oprate", label: "操作" }
    ];
    const forGroup = { "label-align-md": "right", "label-cols-md": "2" };
    const Devices = ["UPS", "空调", "电量仪", "温湿度"];
    let OprateMode: OprateMode = "addTerminal";
    return {
      forGroup,
      TerminalsFields,
      mountDevsFields,
      Devices,
      accont: {
        DevMac: routeDevMac || "86626204542797",
        name: "",
        Type: "",
        mountNode: "",
        mountDev: "",
        protocol: "",
        pid: 0
      },
      // 设备类型
      DevTypes: [],
      // 登记的终端
      RegisterTerminal: null,
      isRegisterTerminal: false,
      // 注册的终端
      Terminal: null,
      // 注册状态
      TerminalStat: true,
      //操作模式
      OprateMode
    };
  },
  computed: {
    //
    Stat() {
      const OprateMode: OprateMode = this.$data.OprateMode;
      let stat = "添加终端";
      switch (OprateMode) {
        case "addTerminal":
          stat = "添加终端";
          break;
        case "addTerminalMountDev":
          stat = "添加终端挂载设备";
          break;
        case "registerTerminalMountDev":
          stat = "修改终端挂载设备";
          break;
      }
      return stat;
    },
    // 返回设备类型,选择协议
    SelectDevtype() {
      const DevTypes: Uart.DevsType[] = this.DevTypes;
      let DevType: string[] = [];
      let Protocols: Map<string, string[]> = new Map();
      DevTypes.forEach(el => {
        DevType.push(el.DevModel);
        Protocols.set(
          el.DevModel,
          el.Protocols.map(e => e.Protocol)
        );
      });
      return { DevType, Protocols };
    },

    // 返回所选设备信息
    TerminalItem() {
      const Terminal: Uart.Terminal = this.$data.Terminal;
      if (Terminal) {
        return [Terminal];
      } else {
        return [];
      }
    }
  },
  watch: {
    Terminal(newValue, oldValue) {
      if (newValue) {
        this.TerminalStat = false;
        this.accont.name = newValue.name;
      } else {
        this.TerminalStat = true;
        this.accont.name = "";
      }
    },
    RegisterTerminal(newValue) {
      if (newValue) {
        this.isRegisterTerminal = true;
        this.accont.mountNode = newValue.mountNode;
      } else {
        this.isRegisterTerminal = false;
        this.accont.mountNode = "";
      }
    }
  },
  apollo: {
    // 设备类型
    DevTypes: {
      query: gql`
        query getDevTypes($Type: String) {
          DevTypes(Type: $Type) {
            DevModel
            Protocols {
              Protocol
            }
          }
        }
      `,
      variables() {
        return {
          Type: this.$data.accont.Type
        };
      },
      skip() {
        return this.$data.accont.Type === "";
      }
    },
    // 登记的终端
    RegisterTerminal: {
      query: gql`
        query getRegisterTerminal($DevMac: String) {
          RegisterTerminal(DevMac: $DevMac) {
            DevMac
            mountNode
          }
        }
      `,
      variables() {
        const DevMac = String(this.$data.accont.DevMac);
        return {
          DevMac
        };
      },
      skip() {
        const DevMac: string = this.$data.accont.DevMac;
        return DevMac.length < 5;
      }
    },
    // 注册的终端
    Terminal: {
      query: gql`
        query getTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            mountNode
            mountDevs {
              Type
              mountDev
              protocol
              pid
            }
          }
        }
      `,
      variables() {
        return { DevMac: String(this.$data.accont.DevMac) };
      },
      skip() {
        const DevMac: string = this.$data.accont.DevMac;
        return DevMac.length < 5;
      }
    }
  },
  methods: {
    // 注册添加终端
    async addTerminal() {
      for (let i in this.accont) {
        if (i === "pid") continue;
        if (!this.$data.accont[i] || this.$data.accont[i] === "") {
          this.$bvModal.msgBoxOk("参数不能为空", { title: "Error", size: "lg" });
          return;
        }
      }
      const OprateMode: OprateMode = this.$data.OprateMode;
      const { DevMac, name, Type, mountNode, mountDev, protocol, pid } = this.$data.accont;
      switch (OprateMode) {
        case "addTerminal":
          {
            const arg = {
              DevMac, name, mountNode, mountDevs: [
                {
                  Type,
                  mountDev,
                  protocol,
                  pid
                }
              ]
            };
            const result = await this.$apollo.mutate({
              mutation: gql`
                mutation addTerminal($arg: JSON) {
                  addTerminal(arg: $arg) {
                    ok
                    msg
                  }
                }
              `,
              variables: {
                arg
              }
            });
          }
          break;
        case "addTerminalMountDev":
          {
            const arg = this.$data.accont;
            const Terminal: Uart.Terminal = this.$data.Terminal;
            const isPidOccupy = Terminal.mountDevs.some(el => el.pid === arg.pid);
            if (isPidOccupy) {
              const isRegister = await this.$bvModal.msgBoxConfirm(`Pid：${arg.pid}已经使用,是否修改Pid：${arg.pid}挂载的设备??`);
              if (isRegister) {
                this.$data.OprateMode = "registerTerminalMountDev";
                this.addTerminal();
              } else {
                this.accont.pid++;
              }
              return;
            } else {
              const result = await this.$apollo.mutate({
                mutation: gql`
                  mutation addTerminalMountDev($arg: JSON) {
                    addTerminalMountDev(arg: $arg) {
                      ok
                      msg
                    }
                  }
                `,
                variables: { arg }
              });
            }
          }
          break;
        case "registerTerminalMountDev":
          {
            const arg = {
              Type,
              mountDev,
              protocol,
              pid
            };
            const result = await this.$apollo.mutate({
              mutation: gql`
                mutation modifyTerminalMountDev(
                  $DevMac: String
                  $pid: Int
                  $arg: JSON
                ) {
                  modifyTerminalMountDev(
                    DevMac: $DevMac
                    pid: $pid
                    arg: $arg
                  ) {
                    ok
                    msg
                  }
                }
              `,
              variables: { DevMac: String(DevMac), pid, arg }
            });
          }
          break;
      }
      this.$apollo.queries.Terminal.refresh();
      this.$data.OprateMode = "";
    },

    // 删除终端
    async deleteTerminal(item: Uart.Terminal) {
      const isDel: boolean = await this.$bvModal.msgBoxConfirm(`确定删除终端：${item.DevMac}??`);
      if (isDel) {
        return;
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation deleteTerminal($DevMac: String) {
              deleteTerminal(DevMac: $DevMac) {
                ok
                msg
              }
            }
          `,
          variables: { DevMac: item.DevMac }
        });
        this.$apollo.queries.Terminal.refresh();
      }
    },
    // 添加终端挂载设备--模式
    async addTerminalMountDev() {
      if (this.$data.OprateMode !== "addTerminalMountDev") {
        this.TerminalStat = true;
        this.$data.OprateMode = "addTerminalMountDev";
      } else {
        this.TerminalStat = false;
        this.$data.OprateMode = "";
      }
      this.accont.Type = "";
      this.accont.mountDev = "";
      this.accont.protocol = "";
    },
    // 修改终端挂载设备模式
    registerTerminalMountDevMode(item: Uart.TerminalMountDevs) {
      if (this.$data.OprateMode !== "registerTerminalMountDev") {
        this.TerminalStat = true;
        this.$data.OprateMode = "registerTerminalMountDev";
        this.accont.pid = item.pid;
        this.accont.Type = item.Type;
        this.accont.mountDev = item.mountDev;
        this.accont.protocol = item.protocol;
      } else {
        this.TerminalStat = false;
        this.$data.OprateMode = "";
        this.accont.Type = "";
        this.accont.mountDev = "";
        this.accont.protocol = "";
      }
    },
    // 删除终端挂载设备
    async delTerminalMountDev(item: Uart.TerminalMountDevs) {
      const DevMac = String(this.accont.DevMac);
      const { pid, mountDev } = item;
      const isDel: boolean = await this.$bvModal.msgBoxConfirm(`确定删除终端绑定设备：Pid(${pid})/${mountDev}??`);
      if (isDel) {
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation delTerminalMountDev(
              $DevMac: String
              $mountDev: String
              $pid: Int
            ) {
              delTerminalMountDev(
                DevMac: $DevMac
                mountDev: $mountDev
                pid: $pid
              ) {
                ok
                msg
              }
            }
          `,
          variables: { DevMac, mountDev, pid }
        });
        this.$apollo.queries.Terminal.refresh();
      }
    }
  }
});
</script>
