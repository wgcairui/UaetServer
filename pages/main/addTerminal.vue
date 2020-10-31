<template>
  <b-col xl="9" cols="12">
    <b-row>
      <separated title="查询设备"></separated>
      <b-col>
        <b-table stacked :items="TerminalItem" :fields="TerminalsFields">
          <template v-slot:cell(oprate)>
            <b-button-group size="sm">
              <b-button variant="info" @click="$bvModal.show('Maddterminal')">添加挂载设备</b-button>
            </b-button-group>
          </template>
        </b-table>
        <b-table-lite
          striped
          borderless
          hover
          :items="Terminal?Terminal.mountDevs:[]"
          :fields="mountDevsFields"
        >
          <template v-slot:cell(oprate)="row1">
            <b-button size="sm" @click="delTerminalMountDev(row1.item)">删除</b-button>
          </template>
        </b-table-lite>
      </b-col>
      <b-modal
        id="Maddterminal"
        title="添加终端挂载设备"
        hide-footer
        size="lg"
        hide-header-close
        header-bg-variant="dark"
        header-text-variant="light"
        centered
      >
        <b-form class="p-5">
          <my-form label="设备地址:">
            <b-form-spinbutton v-model="accont.pid" min="0" max="254"></b-form-spinbutton>
          </my-form>
          <my-form label="挂载设备类型:">
            <b-form-select v-model="accont.Type" :options="['UPS', '空调', '电量仪', '温湿度']" />
          </my-form>
          <my-form label="挂载设备:">
            <b-form-select v-model="accont.mountDev" :options="SelectDevtype.DevType" />
          </my-form>
          <my-form label="协议类型:">
            <b-form-select
              v-model="accont.protocol"
              :options="
                        SelectDevtype.Protocols.get(accont.mountDev) || []
                      "
            />
          </my-form>
          <b-button block @click="addTerminal()" variant="info">Add</b-button>
        </b-form>
      </b-modal>
    </b-row>
  </b-col>
</template>
<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
import deepmerge from "deepmerge";
export default vue.extend({
  data() {
    return {
      TerminalsFields: [
        { key: "DevMac", label: "设备编号" },
        { key: "name", label: "设备名称" },
        { key: "mountNode", label: "注册节点" },
        //{ key: "mountDevs", label: "挂载设备" },
        { key: "oprate", label: "操作" }
      ],
      mountDevsFields: [
        { key: "mountDev", label: "挂载设备" },
        { key: "protocol", label: "协议" },
        "pid",
        { key: "oprate", label: "操作" }
      ],
      accont: {
        DevMac: this.$route.query.DevMac as string,
        name: "",
        Type: "",
        mountNode: "",
        mountDev: "",
        protocol: "",
        pid: 0
      },
      // 设备类型
      DevTypes: [],
      // 注册的终端
      Terminal: null
    };
  },
  computed: {
    TerminalItem() {
      const Terminal = this.$data.Terminal;
      return Terminal ? [Terminal] : [];
    },
    // 返回设备类型,选择协议
    SelectDevtype() {
      const DevTypes: Uart.DevsType[] = this.DevTypes;
      let DevType: string[] = [];
      let Protocols: Map<string, string[]> = new Map();
      DevTypes.forEach(el => {
        DevType.push(el.DevModel);
        Protocols.set(el.DevModel, el.Protocols.map(e => e.Protocol));
      });
      return { DevType, Protocols };
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
        return { Type: this.$data.accont.Type };
      },
      skip() {
        return this.$data.accont.Type === "";
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
        return { DevMac: this.$route.query.DevMac };
      }
      //update: data => (data.Terminal ? [data.Terminal] : [])
    }
  },
  methods: {
    // 注册添加终端
    async addTerminal() {
      const { DevMac, name, Type, mountNode, mountDev, protocol, pid } = this.$data.accont;
      const arg = this.$data.accont;
      const Terminal: Uart.Terminal = this.$data.Terminal;
      console.log({ Terminal, mountDevs: Terminal.mountDevs, acc: this.accont });

      const isPidOccupy = Terminal.mountDevs.find(el => el.pid === arg.pid);
      if (isPidOccupy) {
        const isRegister = await this.$bvModal.msgBoxConfirm(`Pid：${isPidOccupy.pid}已经挂载${isPidOccupy.mountDev},是否替换Pid：${isPidOccupy.mountDev}??`, { buttonSize: "sm", centered: true }
        );
        if (isRegister) {
          const isdel = await this.delTerminalMountDev(isPidOccupy);
          if (isdel) {
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
            this.$apollo.queries.Terminal.refetch();
          }
        }
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
        this.$apollo.queries.Terminal.refetch();
      }
      this.$bvModal.hide("Maddterminal");
    },

    // 删除终端挂载设备
    async delTerminalMountDev(item: Uart.TerminalMountDevs) {
      const DevMac = String(this.$route.query.DevMac);
      const { pid, mountDev } = item;
      const isDel: boolean = await this.$bvModal.msgBoxConfirm(`确定删除终端绑定设备：Pid(${pid})/${mountDev}??`, { buttonSize: "sm", centered: true });
      if (isDel) {
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation delTerminalMountDev( $DevMac: String, $mountDev: String, $pid: Int) {
              delTerminalMountDev( DevMac: $DevMac, mountDev: $mountDev, pid: $pid ) {
                ok
                msg
              }
            }
          `,
          variables: { DevMac, mountDev, pid }
        });
        this.$apollo.queries.Terminal.refetch();
      }
      return isDel;
    }
  }
});
</script>
<style lang="scss" scoped>
.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 1rem;
  padding-top: 4px;
}
</style>
