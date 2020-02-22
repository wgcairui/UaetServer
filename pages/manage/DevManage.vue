<template>
  <div>
    <my-head title="设备管理"></my-head>
    <b-container>
      <b-row class="border-bottom mb-5">
        <separated title="透传设备">
          <b-button variant="success" size="sm" @click="uartAdd = !uartAdd">
            {{
            !uartAdd ? "add" : "hide"
            }}
          </b-button>
        </separated>
        <b-collapse v-model="uartAdd" class="w-100">
          <b-card>
            <b-form>
              <b-form-group label="设备Mac:" v-bind="label">
                <b-input-group>
                  <b-form-input v-model="DevMac" trim></b-form-input>
                  <b-input-group-append>
                    <b-button>检索</b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </b-form>
            <b-collapse v-model="uartTable">
              <b-table-lite stacked :items="uart" :fields="uartField">
                <template v-slot:cell(mountDevs)="row">
                  <i v-if="row.value !== ''">
                    {{
                    row.value.map((el) => el.mountDev)
                    }}
                  </i>
                </template>
                <template v-slot:cell(oprate)="row">
                  <b-button
                    size="sm"
                    disabled
                    v-if="BindDevice.UTs.some((el) => el.DevMac === DevMac)"
                  >已绑定</b-button>
                  <b-button v-else size="sm" @click="addUserTerminal('UT', DevMac)">绑定设备</b-button>
                </template>
              </b-table-lite>
            </b-collapse>
          </b-card>
        </b-collapse>
        <b-table-lite :items="BindDevice.UTs" :fields="uartField">
          <template v-slot:cell(mountDevs)="row">
            <i v-if="row.value !== ''">
              {{
              row.value.map((el) => el.mountDev)
              }}
            </i>
          </template>
          <template v-slot:cell(oprate)="row">
            <b-button size="sm" @click="addUserTerminal('UT', DevMac)">删除</b-button>
          </template>
        </b-table-lite>
      </b-row>
      <b-row>
        <separated title="环控设备">
          <b-button variant="success" size="sm" @click="ecAdd = !ecAdd">
            {{
            !ecAdd ? "add" : "hide"
            }}
          </b-button>
        </separated>
        <b-collapse v-model="ecAdd" class="w-100">
          <b-card>
            <b-form>
              <b-form-group label="环控ID:" v-bind="label">
                <b-input-group>
                  <b-form-input v-model="ECid" trim></b-form-input>
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
                    size="sm"
                    disabled
                    v-if="BindDevice.ECs.some((el) => el.ECid === ECid)"
                  >已绑定</b-button>
                  <b-button v-else size="sm" @click="addUserTerminal('EC', ECid)">绑定设备</b-button>
                </template>
              </b-table-lite>
            </b-collapse>
          </b-card>
        </b-collapse>
        <b-table-lite :items="BindDevice.ECs" :fields="EcField">
          <template v-slot:cell(oprate)="row">
            <b-button size="sm" @click="addUserTerminal('EC', DevMac)">删除</b-button>
          </template>
        </b-table-lite>
      </b-row>
    </b-container>
  </div>
</template>
<script lang="ts">
import vue from "vue";
import MyHead from "../../components/MyHead.vue";
import separated from "../../components/separated.vue";
import gql from "graphql-tag";
export default vue.extend({
  components: {
    MyHead,
    separated
  },
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      DevMac: "86626204542797",
      uartAdd: false,
      uart: [],
      uartField: [
        { key: "DevMac", label: "设备ID" },
        { key: "name", label: "设备别名" },
        { key: "mountDevs", label: "挂载" },
        { key: "oprate", label: "操作" }
      ],

      ecAdd: false,
      ECid: "mac01010025455",
      ECterminal: [],
      EcField: [
        { key: "ECid", label: "环控ID" },
        { key: "name", label: "环控名称" },
        { key: "model", label: "型号" },
        { key: "oprate", label: "操作" }
      ],

      //
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
  },
  computed: {
    uartTable() {
      return (
        this.$data.uart.length > 0 && Object.keys(this.$data.uart[0]).length > 0
      );
    },
    EcTable() {
      return (
        this.$data.ECterminal.length > 0 &&
        Object.keys(this.$data.ECterminal[0]).length > 0
      );
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
      update: (data) => [data.Terminal || {}],
      skip() {
        return this.$data.DevMac.length < 5;
      }
    },
    ECterminal: {
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
      update: (data) => [data.ECterminal || {}],
      skip() {
        return this.$data.ECid.length < 5;
      }
    },

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
      update: (data) => data.BindDevice || { UTs: [], ECs: [] }
    }
  },
  methods: {
    addUserTerminal(type: string, id: string) {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addUserTerminal($type: String, $id: String) {
              addUserTerminal(type: $type, id: $id) {
                ok
                msg
              }
            }
          `,
          variables: { type, id }
        })
        /* .then(({ data }) => {
          if (data.addUserTerminal.ok !== 1)
            return this.$bvModal.msgBoxOk("写入数据库出错");
          this.DevMac = "";
          this.$apollo.queries.BindDevice.refresh();
        }); */
        .then((res) => {
          if (res.data.addUserTerminal.ok !== 1)
            this.$bvModal.msgBoxOk("写入数据库出错");
          else {
            this.$data.DevMac = "";
            this.$apollo.queries.BindDevice.refresh();
          }
        });
    }
  }
});
</script>

<style scoped></style>
