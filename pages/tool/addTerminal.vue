<template>
  <div>
    <b-form>
      <b-form-group label="设备Mac:" label-align-sm="right" label-cols-md="2">
        <b-form-input
          number
          trim
          v-model="accont.DevMac"
          :state="stateDevMac"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="设备别名:" label-align-sm="right" label-cols-md="2">
        <b-form-input trim v-model="accont.name"></b-form-input>
      </b-form-group>
      <b-form-group label="注册节点:" label-align-sm="right" label-cols-md="2">
        <b-form-select
          v-model="accont.mountNode"
          :options="Nodes.map((el) => el.Name)"
        ></b-form-select>
      </b-form-group>
      <b-form-group label="挂载设备:" label-align-sm="right" label-cols-md="2">
        <b-form-select
          v-model="accont.mountDev"
          :options="DevTypes.map((el) => el.DevModel)"
        ></b-form-select>
      </b-form-group>
      <b-form-group label="协议类型:" label-align-sm="right" label-cols-md="2">
        <b-form-select
          v-model="accont.protocol"
          :options="Protocols"
        ></b-form-select>
      </b-form-group>
      <b-form-group label="设备地址：" label-align-sm="right" label-cols-md="2">
        <b-form-select v-model="accont.pid" number>
          <option selected value="0">0</option>
          <option v-for="n in 255" :value="n">{{ n }}</option>
        </b-form-select>
      </b-form-group>
      <b-button block @click="addTerminal">提交</b-button>
    </b-form>
    <b-table-lite :items="Terminals" :fields="TerminalsFields">
      <template v-slot:cell(mountDevs)="row">
        <i>{{ formMountDevs(row.value) }}</i>
      </template>
      <template v-slot:cell(oprate)="row">
        <b-button-group>
          <b-button variant="danger" @click="deleteTerminal(row.item)"
            >删除终端</b-button
          >
          <b-button @click="accont.DevMac = row.item.DevMac">修改终端</b-button>
          <b-button
            variant="info"
            v-b-modal.addTerminalDev
            @click="item = row.item.DevMac"
            >添加设备</b-button
          >
        </b-button-group>
      </template>
    </b-table-lite>
    <b-modal id="addTerminalDev" title="添加挂载设备">
      <b-form>
        <b-form-group label="设备Mac:" label-align-sm="right" label-cols-md="2">
          <i>{{ item }}</i>
        </b-form-group>
        <b-form-group
          label="挂载设备:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select
            v-model="addDev.mountDev"
            :options="DevTypes.map((el) => el.DevModel)"
          ></b-form-select>
        </b-form-group>
        <b-form-group
          label="协议类型:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select
            v-model="addDev.protocol"
            :options="addProtocols"
          ></b-form-select>
        </b-form-group>
        <b-form-group
          label="设备地址："
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select v-model="addDev.pid" number>
            <option selected value="0">0</option>
            <option v-for="n in 255" :value="n">{{ n }}</option>
          </b-form-select>
        </b-form-group>
      </b-form>
      <template v-slot:modal-footer="{ cancel }">
        <b-button size="sm" variant="danger" @click="cancel()">
          Cancel
        </b-button>
        <b-button variant="info" size="sm" @click="addTerminalMountDev">添加</b-button>
      </template>
    </b-modal>
  </div>
</template>
<script>
import Headers from "~/components/Header.vue";
import gql from "graphql-tag";
export default {
  components: {
    Headers
  },
  data() {
    return {
      accont: {
        DevMac: "",
        name: "",
        mountNode: "",
        mountDev: "",
        protocol: "",
        pid: 0
      },
      Nodes: [],
      DevTypes: [],
      Terminals: [],
      Terminal: null,
      TerminalsFields: [
        { key: "DevMac", label: "设备编号" },
        { key: "name", label: "设备名称" },
        { key: "mountNode", label: "注册节点" },
        { key: "mountDevs", label: "挂载设备" },
        { key: "oprate", label: "操作" }
      ],
      item: "",
      addDev: {
        mountDev: "",
        protocol: "",
        pid: 0
      }
    };
  },
  watch: {
    Terminal: function(newVal) {
      if (newVal) {
        this.accont = Object.assign(this.accont, newVal);
        this.accont = Object.assign(this.accont, newVal.mountDevs[0]);
      }
    }
  },
  computed: {
    stateDevMac() {
      if (
        this.accont.DevMac == "" ||
        !Number(this.accont.DevMac) ||
        this.accont.DevMac < 10000000000
      )
        return false;
      else return true;
    },
    Protocols() {
      let types = this.DevTypes.filter(
        (el) => el.DevModel == this.accont.mountDev
      );
      if (types.length == 0) return [];
      return types[0]["Protocols"].map((el) => el.Protocol) || [];
    },
    addProtocols() {
      let types = this.DevTypes.filter(
        (el) => el.DevModel == this.addDev.mountDev
      );
      if (types.length == 0) return [];
      return types[0]["Protocols"].map((el) => el.Protocol) || [];
    }
  },
  apollo: {
    Nodes: gql`
      {
        Nodes {
          Name
        }
      }
    `,
    DevTypes: gql`
      {
        DevTypes {
          DevModel
          Protocols {
            Protocol
          }
        }
      }
    `,
    Terminals: gql`
      {
        Terminals {
          DevMac
          name
          mountNode
          mountDevs {
            mountDev
            protocol
            pid
          }
        }
      }
    `,
    Terminal: {
      query: gql`
        query getTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            mountNode
            mountDevs {
              mountDev
              protocol
              pid
            }
          }
        }
      `,
      variables() {
        return { DevMac: String(this.accont.DevMac) };
      }
    }
  },
  methods: {
    formMountDevs(value) {
      if (!value) return "";
      return value.map((el) => el.mountDev + `[${el.pid}]`).join(",");
    },
    addTerminal() {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addTerminal($arg: JSON) {
              addTerminal(arg: $arg) {
                ok
                msg
              }
            }
          `,
          variables: {
            arg: Object.assign(this.accont, {
              mountDevs: {
                mountDev: this.accont.mountDev,
                protocol: this.accont.protocol,
                pid: this.accont.pid
              }
            })
          }
        })
        .then(({ data }) => this.$apollo.queries.Terminals.refresh());
    },
    deleteTerminal(item) {
      this.$bvModal
        .msgBoxConfirm(`确定删除终端：${item.DevMac}??`)
        .then((value) => {
          if (!value) return;
          this.$apollo
            .mutate({
              mutation: gql`
                mutation deleteTerminal($DevMac: String) {
                  deleteTerminal(DevMac: $DevMac) {
                    ok
                    msg
                  }
                }
              `,
              variables: {
                DevMac: item.DevMac
              }
            })
            .then(() => this.$apollo.queries.Terminals.refresh());
        });
    },
    addTerminalMountDev() {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addTerminalMountDev($arg: JSON) {
              addTerminalMountDev(arg: $arg) {
                ok
                msg
              }
            }
          `,
          variables: {
            arg: Object.assign(this.addDev, { DevMac: this.item })
          }
        })
        .then(() => {
          this.$apollo.queries.Terminals.refresh();
          this.$bvModal.hide("addTerminalDev");
        });
    }
  }
};
</script>
