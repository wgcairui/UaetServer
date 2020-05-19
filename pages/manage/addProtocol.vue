<template>
  <my-page-user title="添加设备" :isUser="false">
    <b-row no-gutters>
      <b-col cols="12">
        <separated title="添加设备协议"></separated>
        <b-form class="p-3">
          <my-form label="协议类型：">
            <b-form-radio-group v-model="accont.Type" :options="[232, 485]"></b-form-radio-group>
          </my-form>
          <my-form label="协议设备类型：">
            <b-form-radio-group
              v-model="accont.ProtocolType"
              :options="[
                  { value: 'ups', text: 'UPS' },
                  { value: 'air', text: '空调' },
                  { value: 'em', text: '电量仪' },
                  { value: 'th', text: '温湿度' }
                ]"
            ></b-form-radio-group>
          </my-form>
          <my-form label="协议名称：">
            <b-form-input v-model="accont.Protocol" :state="accont.Protocol !== ''"></b-form-input>
          </my-form>
        </b-form>
      </b-col>
    </b-row>
    <!--  -->
    <b-row no-gutters>
      <b-col>
        <separated title="指令集"></separated>
        <b-table
          responsive
          ref="table1"
          id="my-table1"
          small
          :items="instructItems"
          :fields="instructItemsFields"
        >
          <template v-slot:cell(formResize)="row">
            <b-button type="link" size="sm" @click="row.toggleDetails" variant="dark">查看</b-button>
          </template>
          <template v-slot:row-details="row">
            <b-card>
              <b-table
                striped
                borderless
                hover
                :items="row.item.formResize"
                :fields="instructResultFields"
              >
                <template v-slot:cell(isState)="row1">
                  <b-checkbox v-model="row1.value" disabled></b-checkbox>
                </template>
              </b-table>
            </b-card>
          </template>
          <template v-slot:cell(oprate)="data">
            <b-button-group>
              <b-button variant="info" size="sm" @click="modify(data)">修改</b-button>
              <b-button variant="danger" size="sm" @click="rm(data)">删除</b-button>
            </b-button-group>
          </template>
        </b-table>
        <b-button
          @click="submit"
          v-if="instructItems.length > 0"
          size="sm"
          block
          variant="success"
          class="mb-3"
        >更新协议</b-button>
      </b-col>
    </b-row>
    <!--  -->
    <b-row no-gutters>
      <b-col>
        <separated title="添加协议指令"></separated>
        <b-card>
          <b-card-body>
            <b-form>
              <my-form label="指令字符：">
                <b-form-input v-model="instruct.name" placeholder="232/QGS或者485/0300010002"></b-form-input>
              </my-form>
              <!--   <b-form-group v-bind="forGroup" :disabled="!instruct.addModel">
               
              </b-form-group>-->
              <my-form label="结果集:">
                <b-form-select
                  v-model="instruct.resultType"
                  :options="['hex', 'utf8', 'float', 'short', 'int']"
                ></b-form-select>
              </my-form>
              <my-form label="字符去头处理:">
                <b-input-group>
                  <b-form-checkbox
                    v-model="instruct.shift"
                    class="py-2 mr-3"
                  >{{ instruct.shiftNum }}</b-form-checkbox>
                  <b-form-input
                    type="range"
                    max="5"
                    min="0"
                    v-model="instruct.shiftNum"
                    v-if="instruct.shift"
                  >2</b-form-input>
                </b-input-group>
              </my-form>
              <my-form label="字符去尾处理:">
                <b-input-group>
                  <b-form-checkbox v-model="instruct.pop" class="py-2 mr-3">{{ instruct.popNum }}</b-form-checkbox>
                  <b-form-input
                    type="range"
                    max="10"
                    min="0"
                    v-model="instruct.popNum"
                    v-if="instruct.pop"
                  >2</b-form-input>
                </b-input-group>
              </my-form>
              <my-form label="解析规则:">
                <b-form-textarea rows="1" max-rows="150" trim v-model="instruct.resize" placeholder></b-form-textarea>
              </my-form>
              <my-form label="解析结果:">
                <b-table-lite
                  responsive
                  bordered
                  small
                  sticky-header
                  :items="formResize"
                  :fields="instructResultFields"
                ></b-table-lite>
              </my-form>

              <b-button
                @click="addInstruct"
                size="sm"
                block
                :variant="instruct.addModel ? 'success' : 'info'"
              >{{ instruct.addModel ? "添加指令" : "修改指令" }}</b-button>
            </b-form>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </my-page-user>
</template>

<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
import { parseJsonToJson } from "../../plugins/tools";
import deepmerge from "deepmerge";
import {
  protocolInstructFormrize,
  protocol,
  protocolInstruct
} from "../../server/bin/interface";
import { BvTableFieldArray } from "bootstrap-vue";

export default vue.extend({
  data() {
    const routeProtocol = this.$route.query.Protocol;
    return {
      // 协议
      accont: {
        Type: 485,
        Protocol: routeProtocol || "",
        ProtocolType: "air"
      },
      // 指令
      instruct: {
        name: "",
        resultType: "hex",
        shift: false,
        shiftNum: 1,
        pop: false,
        popNum: 1,
        resize: "",
        addModel: true
      },
      // 指令集
      instructItems: [] as protocol[],
      //
      instructItemsFields: [
        { key: "name", label: "名称" },
        { key: "resultType", label: "结果集" },
        { key: "shift", label: "字符去头" },
        { key: "shiftNum", label: "去头数" },
        { key: "pop", label: "字符去尾" },
        { key: "popNum", label: "去尾数" },
        { key: "formResize", label: "解析规则" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray,
      // protocol result
      instructResultFields: [
        { key: "name", label: "变量名称:" },
        { key: "regx", label: "对应字段:" },
        { key: "bl", label: "数据倍率(1倍默认不处理数据):" },
        { key: "isState", label: "状态量" },
        { key: "unit", label: "单位" }
      ] as BvTableFieldArray,
      apolloProtocol: null,
      ProtocolsFields: [
        "Type",
        "Protocol",
        "instruct",
        "oprate"
      ] as BvTableFieldArray
    };
  },
  computed: {
    // 解析规则分解为Json，{name:"aa",regx:"1-5",bl:"1",unit:"%"}
    formResize() {
      if (this.$data.instruct.resize == "") return [];
      // resize = "系统1吸气温度+1-2+0.1+℃/送风温度+3-2+0.1+℃"
      const resize: string = this.$data.instruct.resize;
      // 分割字符串并刷选出有内容的 ["系统1吸气温度+1-2+0.1+℃","送风温度+3-2+0.1+℃"]
      const split = resize
        .replace(/(\n)/g, "")
        .split("/")
        .filter(el => el !== "");
      // 继续分割数组，为单个单位 [[[系统1吸气温度],[1-2],[0.1],[℃]"],[[送风温度],[3-2],[0.1],[℃]]]
      const resize1 = split.map(el => el.split("+"));
      // 构建数组对象 [{name:"aa",regx:"1-5",bl:"1",unit:"%"}]
      return resize1.map(
        el =>
          ({
            name: el[0].replace(/(\n)/g, ""),
            regx: el[1],
            bl: parseFloat(el[2]) || 1,
            unit: el[3] || null,
            isState: /(^{.*}$)/.test(el[3]) //el[3]?.includes("{")
          } as protocolInstructFormrize)
      );
    }
    //创建计算对象，用于watch检测
    /*  resize() {
      return <string>this.$data.instruct.resize;
    } */
  },
  watch: {
    //检测到"/"，字符自动换行
    "instruct.resize": function(newVal) {
      if (newVal.endsWith("/")) this.$data.instruct.resize += "\n";
    },
    // 监测协议是否重复，重复之后填充input
    apolloProtocol: function(newVal: protocol) {
      if (newVal) {
        /*  newVal.instruct.forEach(el => {
          this.$data.instructItems.push(el);
        }); */
        this.$data.instructItems = newVal.instruct;
        this.$data.accont.ProtocolType = newVal.ProtocolType;
        this.$data.accont.Type = newVal.Type;
      } else {
        this.$data.instructItems = [];
      }
    }
  },
  apollo: {
    // 根据协议名称判断是否协议重复
    apolloProtocol: {
      query: gql`
        query getProtocol($Protocol: String) {
          apolloProtocol: Protocol(Protocol: $Protocol) {
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
      fetchPolicy: "network-only",
      variables() {
        return {
          Protocol: this.$data.accont.Protocol
        };
      }
      // update: data => data.Protocol
    }
    // 获取所有协议
  },
  methods: {
    // 添加协议
    addInstruct() {
      // 格式化的协议解析字段
      const formResize = this.formResize;
      // 判断字段中是否有错误的
      for (let el of formResize) {
        const a = el.name !== "";
        const isreg = el.regx && /(^[1-9]{1,2}-[1-9])/.test(el.regx);
        /*  const b = typeof el.regx === "string";
        const c = el.regx?.split("-").length == 2;
        const d = el.regx?.split("-").some(e => Number(e)); */
        const e = Number(el.bl);
        if (!a || !isreg || !e) {
          this.$bvModal.msgBoxOk("参数效验错误");
          return;
        }
      }
      const instruct: protocolInstruct = this.$data.instruct;
      instruct.formResize = [];
      const result = <protocolInstruct>deepmerge(instruct, { formResize });
      // 协议
      const instructItems: protocolInstruct[] = this.$data.instructItems;
      // 检测是否为新增指令
      if ((result as any).addModel) {
        if (instructItems.some(val => val.name === result.name)) {
          this.$bvModal.msgBoxOk("指令名称重复");
          return;
        }
        this.$data.instructItems.push(result);
      } else {
        instructItems.forEach((el, index) => {
          if (el.name == result.name) {
            instructItems[index] = result;
            this.$bvModal.msgBoxOk(
              `更新指令${instructItems[index].name} success`
            );
            return;
          }
        });
      }
      // 执行清理操作
      this.instruct.name = "";
      this.instruct.resize = "";
      this.$data.instruct.addModel = true;
    },
    // 修改指令
    modify(data: any) {
      this.instruct = deepmerge(this.$data.instruct, data.item);
      this.instruct.addModel = false;
    },
    // 删除指令
    rm(data: any) {
      this.$bvModal
        .msgBoxConfirm(`确定要删除指令:${data.item.name}吗??`)
        .then(() => {
          const instructItems: protocolInstruct[] = this.$data.instructItems;
          instructItems.forEach((el, index) => {
            if (el.name == data.item.name) {
              instructItems.splice(index, 1);
              return;
            }
          });
        });
    },
    // 上传指令
    submit() {
      //
      const accont = this.$data.accont;
      const instruct: protocolInstruct[] = this.$data.instructItems;

      this.$apollo
        .mutate({
          mutation: gql`
            mutation addProtocolSet($arg: JSON) {
              setProtocol(arg: $arg) {
                msg
                ok
              }
            }
          `,
          variables: {
            arg: Object.assign(accont, { instruct })
          }
        })
        .then(({ data }: { data: any }) => {
          this.$bvModal.msgBoxOk(
            data.setProtocol.ok == 1 ? "上传协议成功" : "上传协议失败"
          );
        });
    }
  },
  head() {
    return {
      title: "添加协议"
    };
  }
});
</script>
