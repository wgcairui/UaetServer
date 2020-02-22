<template>
  <div>
    <my-head title="添加终端" />
    <b-form class="p-5">
      <b-form-group label="设备Mac:" label-align-sm="right" label-cols-md="2">
        <b-form-input
          v-model="accont.DevMac"
          number
          trim
          :state="stateDevMac"
        />
      </b-form-group>
      <b-form-group label="设备别名:" label-align-sm="right" label-cols-md="2">
        <b-form-input v-model="accont.name" trim />
      </b-form-group>
      <b-form-group label="注册节点:" label-align-sm="right" label-cols-md="2">
        <b-form-select
          v-model="accont.mountNode"
          :options="Nodes.map(el => el.Name)"
        />
      </b-form-group>
      <b-form-group label="挂载设备:" label-align-sm="right" label-cols-md="2">
        <b-form-select
          v-model="accont.mountDev"
          :options="DevTypes.map(el => el.DevModel)"
        />
      </b-form-group>
      <b-form-group label="协议类型:" label-align-sm="right" label-cols-md="2">
        <b-form-select v-model="accont.protocol" :options="Protocols" />
      </b-form-group>
      <b-form-group label="设备地址：" label-align-sm="right" label-cols-md="2">
        <b-form-select v-model="accont.pid" number>
          <option selected value="0">
            0
          </option>
          <option v-for="n in 255" :value="n">
            {{ n }}
          </option>
        </b-form-select>
      </b-form-group>
      <b-button block @click="addTerminal">
        提交
      </b-button>
    </b-form>
    <b-table-lite :items="Terminals" :fields="TerminalsFields" responsive>
      <template v-slot:cell(mountDevs)="row">
        <i>{{ formMountDevs(row.value) }}</i>
      </template>
      <template v-slot:cell(oprate)="row">
        <b-button-group>
          <b-button variant="danger" @click="deleteTerminal(row.item)">
            删除终端
          </b-button>
          <b-button @click="accont.DevMac = row.item.DevMac">
            修改终端
          </b-button>
          <b-button
            v-b-modal.addTerminalDev
            variant="info"
            @click="item = row.item.DevMac"
          >
            添加设备
          </b-button>
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
            :options="DevTypes.map(el => el.DevModel)"
          />
        </b-form-group>
        <b-form-group
          label="协议类型:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select v-model="addDev.protocol" :options="addProtocols" />
        </b-form-group>
        <b-form-group
          label="设备地址："
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select v-model="addDev.pid" number>
            <option selected value="0">
              0
            </option>
            <option v-for="n in 255" :value="n">
              {{ n }}
            </option>
          </b-form-select>
        </b-form-group>
      </b-form>
      <template v-slot:modal-footer="{ cancel }">
        <b-button size="sm" variant="danger" @click="cancel()">
          Cancel
        </b-button>
        <b-button variant="info" size="sm" @click="addTerminalMountDev">
          添加
        </b-button>
      </template>
    </b-modal>
  </div>
</template>
<script lang="ts">
import vue from "vue"
import gql from "graphql-tag"
import MyHead from "../../components/MyHead.vue"
import {
  DevsType,
  Terminal,
  TerminalMountDevs
} from "../../server/bin/interface"
export default vue.extend({
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
      ],
      item: "",
      addDev: {
        mountDev: "",
        protocol: "",
        pid: 0
      }
    }
  },
  watch: {
    Terminal(newVal) {
      if (newVal) {
        this.$data.accont = Object.assign(this.$data.accont, newVal)
        this.$data.accont = Object.assign(
          this.$data.accont,
          newVal.mountDevs[0]
        )
      }
    }
  },
  computed: {
    stateDevMac() {
      if (
        this.$data.accont.DevMac == "" ||
        !Number(this.$data.accont.DevMac) ||
        this.$data.accont.DevMac < 10000000000
      )
        return false
      else return true
    },
    Protocols() {
      const DevTypes: DevsType[] = this.$data.DevTypes
      const types: DevsType[] = DevTypes.filter(
        el => el.DevModel == this.$data.accont.mountDev
      )
      if (types.length == 0) return []
      return types[0].Protocols.map(el => el.Protocol) || []
    },
    addProtocols() {
      const DevTypes: DevsType[] = this.$data.DevTypes
      const types = DevTypes.filter(
        el => el.DevModel == this.$data.addDev.mountDev
      )
      if (types.length == 0) return []
      return types[0].Protocols.map(el => el.Protocol) || []
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
        return { DevMac: String(this.$data.accont.DevMac) }
      }
    }
  },
  methods: {
    formMountDevs(value: TerminalMountDevs[]) {
      if (!value) return ""
      return value.map(el => el.mountDev + `[${el.pid}]`).join(",")
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
            arg: Object.assign(this.$data.accont, {
              mountDevs: {
                mountDev: this.$data.accont.mountDev,
                protocol: this.$data.accont.protocol,
                pid: this.$data.accont.pid
              }
            })
          }
        })
        .then(({ data }) => this.$apollo.queries.Terminals.refresh())
    },
    deleteTerminal(item: Terminal) {
      this.$bvModal
        .msgBoxConfirm(`确定删除终端：${item.DevMac}??`)
        .then(value => {
          if (!value) return
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
            .then(() => this.$apollo.queries.Terminals.refresh())
        })
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
            arg: Object.assign(this.$data.addDev, { DevMac: this.$data.item })
          }
        })
        .then(() => {
          this.$apollo.queries.Terminals.refresh()
          this.$bvModal.hide("addTerminalDev")
        })
    }
  }
})
</script>
