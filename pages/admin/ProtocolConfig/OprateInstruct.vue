<template>
  <b-row>
    <b-col>
      <b-row>
        <b-col>
          <separated title="添加操作指令:(指令值如果识别字为%i%i,则把值转换为四个字节的hex字符串,否则转换为两个字节)"></separated>
          <b-form>
            <my-form label="指令名称:">
              <b-form-input v-model="instruct.name"></b-form-input>
            </my-form>
            <my-form label="指令值:">
              <b-form-input
                v-model="instruct.value"
                placeholder="例子:060001%i,占位符%i是发送指令是设定的值,232协议默认不包含占位符"
              ></b-form-input>
            </my-form>
            <my-form label="值的倍数:">
              <b-form-input v-model="instruct.bl"></b-form-input>
            </my-form>
            <my-form label="指令说明:">
              <b-form-textarea v-model="instruct.readme"></b-form-textarea>
            </my-form>
            <div class="text-center">
              <b-button class="w-50" @click="add" variant="info">{{isModify?'修改':'添加'}}</b-button>
            </div>
          </b-form>
        </b-col>
      </b-row>
      <b-row v-if="instructs.length>0">
        <b-col>
          <separated title="操作指令列表"></separated>
          <b-table :items="instructs" :fields="fields">
            <template v-slot:cell(oprate)="row">
              <b-button-group>
                <b-button @click="modify(row.item)">修改</b-button>
                <b-button @click="deletes(row.item)">删除</b-button>
              </b-button-group>
            </template>
          </b-table>
          <div class="text-center">
            <b-button class="w-50" @click="addDevConstent()" variant="success">提交</b-button>
          </div>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      //
      instruct: { name: "", value: "", bl: '1', readme: "" } as Uart.OprateInstruct,
      instructs: [] as Uart.OprateInstruct[],
      fields: [
        { key: "name", label: "指令名称" },
        { key: "value", label: "指令值" },
        "bl",
        { key: "readme", label: "指令说明" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray,
      //stat
      isModify: false
    };
  },
  apollo: {
    ProtocolSingle: {
      query: gql`
        query getProtocol($Protocol: String) {
          ProtocolSingle: Protocol(Protocol: $Protocol) {
            instruct {
              formResize
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      }
    },
    instructs: {
      query: gql`
        query getDevConstant($Protocol: String) {
          instructs: getDevConstant(Protocol: $Protocol) {
            OprateInstruct {
              name
              value
              bl
              readme
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      },
      update: data => data.instructs.OprateInstruct || []
    }
  },
  methods: {
    async add() {
      const instruct = JSON.parse(JSON.stringify(this.$data.instruct)) as Uart.OprateInstruct;
      const instructs = this.$data.instructs as Uart.OprateInstruct[];
      if (this.$data.isModify) {
        instructs.forEach((el, index) => {
          if (el.name === instruct.name) instructs.splice(index, 1, instruct);
        });
      } else {
        const instructExist = instructs.some(el => el.name === instruct.name);
        if (instructExist) {
          const isM = await this.$bvModal.msgBoxConfirm(`指令: ${instruct.name} 已经在列表,是否修改`);
          if (isM) {
            instructs.forEach((el, index) => {
              if (el.name === instruct.name)
                instructs.splice(index, 1, instruct);
            });
          }
        } else {
          this.$data.instructs.push(instruct);
        }
      }
      //
      this.$data.instruct.name = "";
      this.$data.instruct.value = "";
      this.$data.instruct.readme = "";
    },
    modify(items: Uart.OprateInstruct) {
      this.$data.isModify = true;
      this.$data.instruct = JSON.parse(JSON.stringify(items));
    },
    deletes(items: Uart.OprateInstruct) {
      this.$data.instructs = (this.$data.instructs as Uart.OprateInstruct[]).filter(el => el.name !== items.name);
    },
    addDevConstent() {
      const arg = this.$data.instructs as Uart.OprateInstruct[];
      const Protocol = this.$data.Protocol;
      const ProtocolType = this.$data.ProtocolType;
      this.$apollo.mutate({
        mutation: gql`
            mutation addDevConstent(
              $Protocol: String
              $ProtocolType: String
              $type: String
              $arg: JSON
            ) {
              addDevConstent(
                Protocol: $Protocol
                ProtocolType: $ProtocolType
                type: $type
                arg: $arg
              ) {
                ok
                msg
                upserted
              }
            }
          `,
        variables: { arg, Protocol, type: "Oprate" as Uart.ConstantThresholdType, ProtocolType }
      })
        .then((res: any) => {
          const ok = res.data.addDevConstent.ok;
          if (ok > 0) {
            this.$bvToast.toast("配置success", { variant: "info", title: "Info" });
            //this.$apollo.queries.DevConstant.refresh();
          }
        });
    }
  }
});
</script>