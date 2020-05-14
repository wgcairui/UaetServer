<template>
  <div>
    <my-head title="设备管理" />
    <b-container>
      <b-row class="border-bottom mb-5">
        <separated title="透传设备">
          <b-button
            variant="success"
            size="sm"
            @click="uartAdd = !uartAdd"
          >{{ !uartAdd ? "add" : "hide" }}</b-button>
        </separated>
        <b-collapse v-model="uartAdd" class="w-100">
          <b-card>
            <b-form>
              <my-form label="设备Mac:">
                <b-input-group>
                  <b-form-input v-model="DevMac" trim />
                  <b-input-group-append>
                    <b-button>检索</b-button>
                  </b-input-group-append>
                </b-input-group>
              </my-form>
            </b-form>
            <b-collapse v-model="uartTable">
              <b-table-lite stacked :items="uart" :fields="uartField">
                <template v-slot:cell(mountDevs)="row">
                  <i v-if="row.value !== ''">{{ row.value.map(el => el.mountDev) }}</i>
                </template>
                <template v-slot:cell(oprate)>
                  <b-button
                    v-if="BindDevice.UTs.some(el => el.DevMac === DevMac)"
                    size="sm"
                    disabled
                  >已绑定</b-button>
                  <b-button v-else size="sm" @click="addUserTerminal('UT', DevMac)">绑定设备</b-button>
                </template>
              </b-table-lite>
            </b-collapse>
          </b-card>
        </b-collapse>
        <b-table-lite :items="items.UTs" :fields="uartField">
          <template v-slot:cell(mountDevs)="row">
            <i v-if="row.value !== ''">{{ row.value.map(el => el.mountDev) }}</i>
          </template>
          <template v-slot:cell(oprate)="row">
            <b-button size="sm" @click="delUserTerminal('UT', row.item)">删除</b-button>
          </template>
        </b-table-lite>
      </b-row>
      <!-- <b-row>
        <separated title="环控设备">
          <b-button variant="success" size="sm" @click="ecAdd = !ecAdd">
            {{ !ecAdd ? "add" : "hide" }}
          </b-button>
        </separated>
        <b-collapse v-model="ecAdd" class="w-100">
          <b-card>
            <b-form>
              <b-form-group label="环控ID:" v-bind="label">
                <b-input-group>
                  <b-form-input v-model="ECid" trim />
                  <b-input-group-append>
                    <b-button>检索</b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </b-form>
            <b-collapse v-model="EcTable">
              <b-table-lite stacked :items="ECterminal" :fields="EcField">
                <template v-slot:cell(oprate)="row">
                  <b-button
                    v-if="BindDevice.ECs.some(el => el.ECid === ECid)"
                    size="sm"
                    disabled
                  >
                    已绑定
                  </b-button>
                  <b-button
                    v-else
                    size="sm"
                    @click="addUserTerminal('EC', ECid)"
                  >
                    绑定设备
                  </b-button>
                </template>
              </b-table-lite>
            </b-collapse>
          </b-card>
        </b-collapse>
        <b-table-lite :items="items.ECs" :fields="EcField">
          <template v-slot:cell(oprate)="row">
            <b-button size="sm" @click="addUserTerminal('EC', DevMac)">
              删除
            </b-button>
          </template>
        </b-table-lite>
      </b-row>-->
    </b-container>
  </div>
</template>
<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
export default vue.extend({
  data() {
    return {
      DevMac: "86626204542797",
      uartAdd: false,
      uart: [],
      uartField: [
        { key: "DevMac", label: "设备ID" },
        { key: "name", label: "设备别名" },
        { key: "mountDevs", label: "挂载" },
        { key: "oprate", label: "操作" }
      ],

      /* ecAdd: false,
      ECid: "mac01010025455",
      ECterminal: [],
      EcField: [
        { key: "ECid", label: "环控ID" },
        { key: "name", label: "环控名称" },
        { key: "model", label: "型号" },
        { key: "oprate", label: "操作" }
      ], */

      //
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
  },
  computed: {
    items() {
      const BindDevice = this.BindDevice;
      console.log(BindDevice);
      
      const result = { UTs: [], ECs: [] };
      if (BindDevice.UTs.length > 0) {
        result.UTs = BindDevice.UTs;
      }
      if (BindDevice.ECs.length > 0) {
        result.ECs = BindDevice.ECs;
      }
      return result;
    },
    uartTable: {
      get: function() {
        return (
          this.$data.uart.length > 0 &&
          Object.keys(this.$data.uart[0]).length > 0
        );
      },
      set: function() {}
    },
    EcTable: {
      get: function() {
        return (
          this.$data.ECterminal.length > 0 &&
          Object.keys(this.$data.ECterminal[0]).length > 0
        );
      },
      set: function() {}
    }
  },
  apollo: {
    uart: {
      query: gql`
        query get_addTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            mountDevs {
              mountDev
            }
          }
        }
      `,
      variables() {
        return {
          DevMac: this.$data.DevMac
        };
      },
      update: data => [data.Terminal || {}],
      skip() {
        return this.$data.DevMac.length < 5;
      }
    },
    /* ECterminal: {
      query: gql`
        query get_addECterminal($ECid: String) {
          ECterminal(ECid: $ECid) {
            ECid
            name
            model
          }
        }
      `,
      variables() {
        return { ECid: this.$data.ECid };
      },
      update: data => [data.ECterminal || {}],
      skip() {
        return this.$data.ECid.length < 5;
      }
    }, */

    BindDevice: {
      query: gql`
        query getUserBindDevice {
          BindDevice {
            UTs {
              DevMac
              name
              mountDevs {
                mountDev
              }
            }
            ECs {
              ECid
              name
              model
            }
          }
        }
      `,
      update: data => data.BindDevice || { UTs: [], ECs: [] }
    }
  },
  methods: {
    async addUserTerminal(type: string, id: string) {
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation addUserTerminal($type: String, $id: String) {
            addUserTerminal(type: $type, id: $id) {
              ok
              msg
            }
          }
        `,
        variables: { type, id }
      });
      if (result.data.addUserTerminal.ok !== 1)
        this.$bvModal.msgBoxOk(result.data.addUserTerminal.msg);
      else {
        this.$data.DevMac = "";
        this.$apollo.queries.BindDevice.refetch()
      }
    },
    async delUserTerminal(type: string, item: { DevMac: string }) {
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation delUserTerminal($type: String, $id: String) {
            delUserTerminal(type: $type, id: $id) {
              ok
              msg
            }
          }
        `,
        variables: { type, id: item.DevMac }
      });
      this.$apollo.queries.BindDevice.refetch()
    }
  }
});
</script>

<style scoped></style>
