<template>
  <my-page-manage title="添加设备" :isUser="false">
    <separated title="添加设备" />
    <b-form class="p-2">
      <b-form-group label="设备型号:" v-bind="forGroup">
        <b-form-input v-model="accont.DevModel" trim />
      </b-form-group>
      <b-form-group label="设备类型:" v-bind="forGroup">
        <b-form-select v-model="accont.Type" :options="['UPS', '空调', '电量仪', '温湿度']" />
      </b-form-group>
      <b-form-group label="设备协议(可多选):" v-bind="forGroup">
        <b-form-select v-model="accont.Protocols" multiple :options="filterProtocols" />
      </b-form-group>
      <b-form-group label="已选协议:" v-bind="forGroup">
        <b-form-input v-model="selectProtocols" plaintext />
      </b-form-group>
      <b-button block @click="addDevType">submit</b-button>
    </b-form>
    <separated title="所有设备型号" />
    <b-table-lite :items="DevTypes" responsive :fields="DevTypesFields">
      <template v-slot:cell(Protocols)="row">
        <p>{{ row.value.map(el => el.Protocol) }}</p>
      </template>
      <template v-slot:cell(oprate)="row">
        <b-button-group>
          <b-button @click="accont.DevModel = row.item.DevModel" variant="info">修改</b-button>
          <b-button @click="deleteDevModel(row.item)">delete</b-button>
        </b-button-group>
      </template>
    </b-table-lite>
  </my-page-manage>
</template>
<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
import { protocol, DevsType } from "uart";

export default vue.extend({
  data() {
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      accont: {
        Type: "ups",
        DevModel: "海信3KW列间空调",
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
      const Protocols: protocol[] = this.$data.accont.Protocols;
      return Protocols.map(el => el.Protocol).toString();
    },
    filterProtocols() {
      const Protocols: protocol[] = this.$data.Protocols;
      const type = {
        ups: "UPS",
        air: "空调",
        em: "电量仪",
        th: "温湿度"
      };
      return Protocols.filter(
        el => this.$data.accont.Type === type[el.ProtocolType]
      ).map(el => ({ text: el.Protocol, value: el }));
    }
  },
  watch: {
    statDevType(newVal) {
      if (newVal) {
        this.$data.accont = Object.assign(this.$data.accont, newVal);
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
      ` /* ,
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
          DevModel: this.$data.accont.DevModel
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
        .then(res => {
          this.$bvModal.msgBoxOk(res.data.addDevType ? "提交成功" : "提交失败");
          this.$apollo.queries.DevTypes.refresh();
        });
    },
    deleteDevModel(item: DevsType) {
      this.$bvModal
        .msgBoxConfirm(`确定删除型号"${item.DevModel}"？？？`)
        .then(value => {
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
            .then(res => {
              if (res.data.deleteDevModel)
                this.$apollo.queries.DevTypes.refresh();
              else this.$bvModal.msgBoxOk("流程出错");
            });
        });
    }
  }
});
</script>
