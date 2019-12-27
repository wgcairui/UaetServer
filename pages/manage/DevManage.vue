<template>
  <div>
    <my-head title="设备管理"></my-head>
    <b-container>
      <b-row>
        <separated title="透传设备">
          <b-button variant="success" size="sm" @click="uartAdd = !uartAdd">{{
            !uartAdd ? "add" : "hide"
          }}</b-button>
        </separated>
        <b-collapse v-model="uartAdd" class=" w-100">
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
                  <i v-if="row.value !== ''">{{
                    row.value.map((el) => el.mountDev)
                  }}</i>
                </template>
                <template v-slot:cell(oprate)="row">
                  <b-button size="sm" @click="addUserTerminal('UT', DevMac)"
                    >绑定设备</b-button
                  >
                </template>
              </b-table-lite>
            </b-collapse>
          </b-card>
        </b-collapse>
        <b-table-lite :items="BindDevice.UTs" :fields="uartField">
          <template v-slot:cell(mountDevs)="row">
            <i v-if="row.value !== ''">{{
              row.value.map((el) => el.mountDev)
            }}</i>
          </template>
          <template v-slot:cell(oprate)="row">
            <b-button size="sm" @click="addUserTerminal('UT', DevMac)"
              >删除</b-button
            >
          </template>
        </b-table-lite>
      </b-row>
      <b-row>
        <separated title="环控设备"></separated>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import MyHead from "@/components/MyHead";
import separated from "@/components/separated";
import gql from "graphql-tag";
export default {
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
      uarts: [],
      uart: [],
      uartField: [
        { key: "DevMac", label: "设备ID" },
        { key: "name", label: "设备别名" },
        { key: "mountDevs", label: "挂载" },
        { key: "oprate", label: "操作" }
      ],
      //
      ECid: "",
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
  },
  computed: {
    uartTable: {
      get() {
        return this.uart.length > 0 && Object.keys(this.uart[0]).length > 0;
      },
      set() {}
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
          DevMac: this.DevMac
        };
      },
      update: (data) => [data.Terminal || {}],
      skip() {
        return this.DevMac.length < 5;
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
          }
        }
      `
    }
  },
  methods: {
    addUserTerminal(type, id) {
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
        .then(({ data }) => {
          if (data.addUserTerminal.ok !== 1)
            return this.$bvModal.msgBoxOk("写入数据库出错");
          this.DevMac = "";
          this.$apollo.queries.BindDevice.refresh();
        });
    }
  }
};
</script>

<style scoped></style>
