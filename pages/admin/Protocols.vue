<template>
  <b-row>
    <b-col>
      <b-row>
        <b-col>
          <separated title="filter"></separated>
          <b-card>
            <b-form>
              <b-form-group label="协议类型:" v-bind="forGroup">
                <b-form-radio-group v-model="DevType" :options="DevTypes"></b-form-radio-group>
              </b-form-group>
              <b-form-group label="协议名称:" v-bind="forGroup" v-if="DevType !== ''">
                <b-form-select v-model="selectProtocol" :options="instructsNames"></b-form-select>
              </b-form-group>
            </b-form>
          </b-card>
        </b-col>
      </b-row>
      <!--  -->
      <b-row>
        <b-col>
          <separated title="所有协议指令"></separated>

          <b-table-lite :items="protocolsFilter" :fields="ProtocolsFields" responsive>
            <template v-slot:cell(instruct)="row">
              <b-button @click="row.toggleDetails" size="sm">详情</b-button>
            </template>
            <template v-slot:cell(oprate)="data">
              <b-button-group>
                <b-button
                  variant="info"
                  :to="{
                    name: 'admin-ProtocolConfig-OprateInstruct',
                    query: {
                      ProtocolType: data.item.ProtocolType,
                      Protocol: data.item.Protocol
                    }
                  }"
                >操作指令</b-button>
                <b-button
                  variant="info"
                  :to="{
                    name: 'admin-ProtocolConfig-DevConstant',
                    query: {
                      ProtocolType: data.item.ProtocolType,
                      Protocol: data.item.Protocol
                    }
                  }"
                >常量配置</b-button>
                <b-button
                  variant="info"
                  :to="{
                    name: 'admin-ProtocolConfig-Threshold',
                    query: {
                      ProtocolType: data.item.ProtocolType,
                      Protocol: data.item.Protocol
                    }
                  }"
                >阀值配置</b-button>
                <b-button
                  variant="info"
                  :to="{
                    name: 'admin-ProtocolConfig-StatWacth',
                    query: {
                      ProtocolType: data.item.ProtocolType,
                      Protocol: data.item.Protocol
                    }
                  }"
                >状态监控</b-button>
                <b-button
                  variant="info"
                  :to="{
                    name: 'admin-ProtocolConfig-ShowTag',
                    query: {
                      ProtocolType: data.item.ProtocolType,
                      Protocol: data.item.Protocol
                    }
                  }"
                >显示标签</b-button>

                <b-button
                  variant="info"
                  :to="{
                    name: 'admin-addProtocol',
                    query: {
                      Protocol: data.item.Protocol
                    }
                  }"
                >修改协议</b-button>
                <b-button @click="deleteProtocol(data.item)" size="sm">delete</b-button>
              </b-button-group>
            </template>
            <template v-slot:row-details="row">
              <b-card>
                <b-table-lite responsive :items="row.item.instruct" :fields="instructFields">
                  <template v-slot:cell(formResize)="row2">
                    <b-button @click="row2.toggleDetails" size="sm">详情</b-button>
                  </template>
                  <template v-slot:row-details="row2">
                    <b-card>
                      <b-table-lite :items="row2.item.formResize"></b-table-lite>
                    </b-card>
                  </template>
                </b-table-lite>
              </b-card>
            </template>
          </b-table-lite>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { protocol, protocolInstruct } from "uart";
export default Vue.extend({
  data() {
    let Protocols: protocol[] = [];
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      DevType: "",
      DevTypes: [
        { text: "UPS", value: "ups" },
        { text: "空调", value: "air" },
        { text: "电量仪", value: "em" },
        { text: "温湿度", value: "th" }
      ],
      selectProtocol: "",
      Protocols,
      ProtocolsFields: [
        { key: "Type", label: "类型" },
        { key: "Protocol", label: "协议名称" },
        { key: "ProtocolType", label: "协议类型" },
        { key: "instruct", label: "详情" },
        { key: "oprate", label: "操作" }
      ],
      instructFields: [
        { key: "name", label: "指令" },
        { key: "resultType", label: "解析类型" },
        { key: "shift", label: "去头" },
        { key: "shiftNum", label: "去头数" },
        { key: "pop", label: "去尾" },
        { key: "popNum", label: "去尾数" },
        { key: "formResize", label: "解析规则" }
      ]
    };
  },
  computed: {
    instructsNames() {
      let result: string[] = [];
      if (this.Protocols.length > 0) {
        this.Protocols.forEach(el => {
          if (el.ProtocolType === this.DevType) {
            result.push(el.Protocol);
          }
        });
      }
      return result;
    },
    protocolsFilter() {
      const Protocols: protocol[] = this.$data.Protocols;
      if (this.selectProtocol !== "") {
        return Protocols.filter(
          el => el.Protocol === this.$data.selectProtocol
        );
      }
      if (this.DevType !== "") {
        return Protocols.filter(el => el.ProtocolType === this.$data.DevType);
      }
      return Protocols;
    }
  },
  apollo: {
    Protocols: {
      query: gql`
        {
          Protocols {
            Type
            Protocol
            ProtocolType
            instruct {
              name
              resultType
              shift
              shiftNum
              pop
              popNum
              resize
              formResize
            }
          }
        }
      `,
      fetchPolicy: "network-only"
    }
  },
  methods: {
    linkConfig(item: { ProtocolType: string; Protoclo: string }) {
      console.log(item);

      const { ProtocolType, Protoclo } = item;
      //:to="{name:'admin-configuration',query:{DevType:data.item}}"
      this.$router.push({
        name: "admin-configuration",
        params: { ProtocolType, Protoclo }
      });
    },
    //
    deleteProtocol(item: any) {
      return;
      /* this.$bvModal
        .msgBoxConfirm(`确定要删除指令:${item.Protocol}吗??`)
        .then(() => {
          this.$apollo
            .mutate({
              mutation: gql`
                mutation deleteProtocol($Protocol: String) {
                  deleteProtocol(Protocol: $Protocol) {
                    ok
                    msg
                  }
                }
              `,
              variables: {
                Protocol: item.Protocol
              }
            })
            .then(() => this.$apollo.queries.Protocols.refresh());
        }); */
    }
  }
});
</script>
