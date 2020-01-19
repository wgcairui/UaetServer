<template>
  <div>
    <my-head title="添加设备"></my-head>
    <separated title="添加设备"></separated>
    <b-form class=" p-2">
      <b-form-group label="设备型号:" v-bind="forGroup">
        <b-form-input trim v-model="accont.DevModel"></b-form-input>
      </b-form-group>
      <b-form-group label="设备类型:" v-bind="forGroup">
        <b-form-select
          v-model="accont.Type"
          :options="[{value:'ups',text:'UPS'}, {value:'air',text:'空调'}, {value:'em',text:'电量仪'}, {value:'th',text:'温湿度'}]"
        ></b-form-select>
      </b-form-group>
      <b-form-group label="设备协议(可多选):" v-bind="forGroup">
        <b-form-select
          multiple
          v-model="accont.Protocols"
          :options="filterProtocols"
        ></b-form-select>
      </b-form-group>
      <b-form-group label="已选协议:" v-bind="forGroup">
        <b-form-input plaintext v-model="selectProtocols"></b-form-input>
      </b-form-group>
      <b-button block @click="addDevType">submit</b-button>
    </b-form>
    <separated title="所有设备型号"></separated>
    <b-table-lite :items="DevTypes" responsive :fields="DevTypesFields">
      <template v-slot:cell(Protocols)="row">
        <p>{{ row.value.map((el) => el.Protocol) }}</p>
      </template>
      <template v-slot:cell(oprate)="row">
        <b-button @click="deleteDevModel(row.item)">delete</b-button>
      </template>
    </b-table-lite>
  </div>
</template>
<script>
import separated from "~/components/separated";
import MyHead from '@/components/MyHead'
import gql from "graphql-tag";
export default {
  components: {
    separated,
    MyHead
  },
  data() {
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      accont: {
        Type: "ups",
        DevModel: "",
        Protocols: []
      },
      DevTypesFields: [
        { key: "Type", label: "类型", sortable: true },
        { key: "DevModel", label: "型号" },
        { key: "Protocols", label: "协议集" },
        "oprate"
      ],
      statDevType: null,
      Protocols: [],
      DevTypes: []
    };
  },
  computed: {
    selectProtocols() {
      return this.accont.Protocols.map((el) => el.Protocol).toString();
    },
    filterProtocols(){
      return this.Protocols.filter(el=>el.ProtocolType === this.accont.Type).map(el=>({ text: el.Protocol, value: el }))
    }
  },
  watch: {
    statDevType: function(newVal) {
      if (newVal) {
        this.accont = Object.assign(this.accont, newVal);
      }
    }
  },
  apollo: {
    Protocols: {
      query: gql`
        {
          Protocols {
            Type
            ProtocolType
            Protocol
          }
        }
      `/* ,
      update: (data) =>
        data.Protocols.map((el) => ({ text: el.Protocol, value: el })) */
    },
    statDevType: {
      query: gql`
        query getDevType($DevModel: String) {
          statDevType: DevType(DevModel: $DevModel) {
            Type
            DevModel
            Protocols {
              Type
              Protocol
            }
          }
        }
      `,
      variables() {
        return {
          DevModel: this.accont.DevModel
        };
      }
    },
    DevTypes: gql`
      {
        DevTypes {
          Type
          DevModel
          Protocols {
            Type
            Protocol
          }
        }
      }
    `
  },
  methods: {
    addDevType() {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addDevType($arg: JSON) {
              addDevType(arg: $arg) {
                ok
                msg
              }
            }
          `,
          variables: {
            arg: this.$data.accont
          }
        })
        .then((res) => {
          this.$bvModal.msgBoxOk(res.data.addDevType ? "提交成功" : "提交失败");
          this.$apollo.queries.DevTypes.refresh();
        });
    },
    deleteDevModel(item) {
      this.$bvModal
        .msgBoxConfirm(`确定删除型号"${item.DevModel}"？？？`)
        .then((value) => {
          if (!value) return;
          this.$apollo
            .mutate({
              mutation: gql`
                mutation deleteDevModel($DevModel: String) {
                  deleteDevModel(DevModel: $DevModel) {
                    msg
                    ok
                  }
                }
              `,
              variables: {
                DevModel: item.DevModel
              }
            })
            .then((res) => {
              if (res.data.deleteDevModel)
                this.$apollo.queries.DevTypes.refresh();
              else this.$bvModal.msgBoxOk("流程出错");
            });
        });
    }
  }
};
</script>
