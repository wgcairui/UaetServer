<template>
  <div>
    <my-head title="添加终端"></my-head>
    <b-container>
      <b-row>
        <b-col>
          <b-form class=" p-5">
            <b-form-group
              label="设备Mac:"
              label-align-sm="right"
              label-cols-md="2"
            >
              <b-form-input number trim v-model="accont.DevMac"></b-form-input>
            </b-form-group>

            <b-form-group
              label="注册节点:"
              label-align-sm="right"
              label-cols-md="2"
            >
              <b-form-select
                v-model="accont.mountNode"
                :options="Nodes.map((el) => el.Name)"
              ></b-form-select>
            </b-form-group>

            <b-button block @click="addTerminal">提交</b-button>
          </b-form>
          <b-table-lite :items="Terminals" :fields="TerminalsFields" responsive>
            <template v-slot:cell(mountDevs)="row">
              <i>{{ formMountDevs(row.value) }}</i>
            </template>
            <template v-slot:cell(oprate)="row">
              <b-button-group>
                <b-button variant="danger" @click="deleteTerminal(row.item)"
                  >删除终端</b-button
                >
                <b-button @click="accont.DevMac = row.item.DevMac"
                  >修改终端</b-button
                >
                <b-button
                  variant="info"
                  v-b-modal.addTerminalDev
                  @click="item = row.item.DevMac"
                  >添加设备</b-button
                >
              </b-button-group>
            </template>
          </b-table-lite>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import MyHead from "@/components/MyHead";
import gql from "graphql-tag";
export default {
  components: {
    MyHead
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
      ]
    };
  },

  apollo: {
    Nodes: gql`
      {
        Nodes {
          Name
        }
      }
    `
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
