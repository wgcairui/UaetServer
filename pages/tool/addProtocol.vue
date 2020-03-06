<template>
  <div>
    <my-head title="添加设备"></my-head>
    <b-container fluid>
      <b-row no-gutters>
        <b-col cols="12">
          <separated title="添加设备协议"></separated>
          <b-form class="p-3">
            <b-form-group label="协议类型：" v-bind="forGroup">
              <b-form-radio-group
                v-model="accont.Type"
                :options="[232, 485]"
              ></b-form-radio-group>
            </b-form-group>
            <b-form-group label="协议设备类型：" v-bind="forGroup">
              <b-form-radio-group
                v-model="accont.ProtocolType"
                :options="[
                  { value: 'ups', text: 'UPS' },
                  { value: 'air', text: '空调' },
                  { value: 'em', text: '电量仪' },
                  { value: 'th', text: '温湿度' }
                ]"
              ></b-form-radio-group>
            </b-form-group>
            <b-form-group label="协议名称：" v-bind="forGroup">
              <b-form-input
                v-model="accont.Protocol"
                :state="accont.Protocol !== ''"
              ></b-form-input>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
      <b-row no-gutters>
        <b-col>
          <separated title="指令集"></separated>
          <b-table-lite
            responsive
            ref="table1"
            id="my-table1"
            small
            :items="instructItems"
            :fields="instructItemsFields"
          >
            <template v-slot:cell(formResize)="row">
              <b-button
                type="link"
                size="sm"
                @click="row.toggleDetails"
                variant="dark"
                >查看</b-button
              >
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
                <b-button variant="info" size="sm" @click="modify(data)"
                  >修改</b-button
                >
                <b-button variant="danger" size="sm" @click="rm(data)"
                  >删除</b-button
                >
              </b-button-group>
            </template>
          </b-table-lite>
          <b-button
            @click="submit"
            v-if="instructItems.length > 0"
            block
            variant="success"
            class="mb-3"
            >上传协议</b-button
          >
        </b-col>
      </b-row>

      <b-row no-gutters>
        <b-col>
          <separated title="添加协议指令"></separated>
          <b-card>
            <b-card-body>
              <b-form>
                <b-form-group
                  label="指令字符："
                  v-bind="forGroup"
                  :disabled="!instruct.addModel"
                >
                  <b-form-input
                    v-model="instruct.name"
                    placeholder="QGS或者010300000002b5c0"
                  ></b-form-input>
                </b-form-group>
                <b-form-group label="结果集:" v-bind="forGroup">
                  <b-form-select
                    v-model="instruct.resultType"
                    :options="['hex', 'utf8', 'float', 'short', 'int']"
                  ></b-form-select>
                </b-form-group>
                <b-form-group label="字符去头处理:" v-bind="forGroup">
                  <b-input-group>
                    <b-form-checkbox
                      v-model="instruct.shift"
                      class="py-2 mr-3"
                      >{{ instruct.shiftNum }}</b-form-checkbox
                    >
                    <b-form-input
                      type="range"
                      max="5"
                      min="0"
                      v-model="instruct.shiftNum"
                      v-if="instruct.shift"
                      >2</b-form-input
                    >
                  </b-input-group>
                </b-form-group>
                <b-form-group label="字符去尾处理:" v-bind="forGroup">
                  <b-input-group>
                    <b-form-checkbox v-model="instruct.pop" class="py-2 mr-3">
                      {{ instruct.popNum }}
                    </b-form-checkbox>
                    <b-form-input
                      type="range"
                      max="10"
                      min="0"
                      v-model="instruct.popNum"
                      v-if="instruct.pop"
                      >2</b-form-input
                    >
                  </b-input-group>
                </b-form-group>
                <b-form-group label="解析规则:" v-bind="forGroup">
                  <b-form-textarea
                    rows="1"
                    max-rows="150"
                    trim
                    v-model="instruct.resize"
                    placeholder=""
                  ></b-form-textarea>
                </b-form-group>
                <b-form-group label="解析结果:" v-bind="forGroup">
                  <b-table-lite
                    responsive
                    bordered
                    small
                    sticky-header
                    :items="formResize"
                    :fields="instructResultFields"
                  ></b-table-lite>
                </b-form-group>
                <b-button
                  @click="addInstruct"
                  block
                  :variant="instruct.addModel ? 'success' : 'info'"
                  >{{ instruct.addModel ? "添加指令" : "修改指令" }}</b-button
                >
              </b-form>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script lang="ts">
import vue from "vue";
import MyHead from "../../components/MyHead.vue";
import separated from "../../components/separated.vue";
import gql from "graphql-tag";
import { parseJsonToJson } from "../../plugins/tools";
import deepmerge from "deepmerge";
import {
  protocolInstructFormrize,
  protocol,
  protocolInstruct
} from "../../server/bin/interface";

export default vue.extend({
  components: {
    separated,
    MyHead
  },
  data() {
    const routeProtocol = this.$route.query.Protocol;
    return {
      // from-group bind
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      accont: {
        Type: 485,
        Protocol: routeProtocol || "卡乐控制器",
        ProtocolType: "air"
      },
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
      instructItems: [],
      // add protocol
      instructItemsFields: [
        { key: "name", label: "名称" },
        { key: "resultType", label: "结果集" },
        { key: "shift", label: "字符去头" },
        { key: "shiftNum", label: "去头数" },
        { key: "pop", label: "字符去尾" },
        { key: "popNum", label: "去尾数" },
        { key: "formResize", label: "解析规则" },
        { key: "oprate", label: "操作" }
      ],
      // protocol result
      instructResultFields: [
        { key: "name", label: "变量名称:" },
        { key: "regx", label: "对应字段:" },
        { key: "bl", label: "数据倍率(1倍默认不处理数据):" },
        { key: "isState", label: "状态量" },
        { key: "unit", label: "单位" }
      ],
      apolloProtocol: null,
      ProtocolsFields: ["Type", "Protocol", "instruct", "oprate"]
    };
  },
  computed: {
    // 解析规则分解为Json，{name:"aa",regx:"1-5",bl:"1",unit:"%"}
    formResize() {
      if (this.$data.instruct.resize == "") return [];
      // resize = "系统1吸气温度+1-2+0.1+℃/送风温度+3-2+0.1+℃"
      const resize: string = this.$data.instruct.resize;
      // 分割字符串并刷选出有内容的 ["系统1吸气温度+1-2+0.1+℃","送风温度+3-2+0.1+℃"]
      let split = resize.split("/").filter(el => el !== "");
      // 继续分割数组，为单个单位 [[[系统1吸气温度],[1-2],[0.1],[℃]"],[[送风温度],[3-2],[0.1],[℃]]]
      let resize1 = split.map(el => el.split("+"));
      // 构建数组对象 [{name:"aa",regx:"1-5",bl:"1",unit:"%"}]
      let result = resize1.map(el => {
        let Obj: protocolInstructFormrize = {
          name: el[0].replace(/\n/g, ""),
          regx: el[1],
          bl: parseFloat(el[2]) || 1,
          unit: el[3] || null,
          isState: el[3]?.includes("{")
        };
        return Obj;
      });
      /* let result1: protocolInstructFormrize[] = resize
        .split("/")
        .filter(el => el !== "")
        .map(el => el.split("+"))
        .map(el => ({
          name: el[0],
          regx: el[1] || null,
          bl: parseInt(el[2]) || 1,
          unit: el[3] || null,
          isState: el[3] && el[3].includes("{") ? true : false
        })); */
      return result;
    },
    //创建计算对象，用于watch检测
    resize() {
      return <string>this.$data.instruct.resize;
    }
  },
  watch: {
    //检测到"/"，字符自动换行
    resize: function(newVal) {
      if (newVal.endsWith("/")) this.$data.instruct.resize += "\n";
    },
    // 监测协议是否重复，重复之后填充input
    apolloProtocol: function(newVal: protocol) {
      if (newVal) {
        newVal.instruct.forEach(el => {
          this.$data.instructItems.push(el);
        });
        this.$data.accont.ProtocolType = newVal.ProtocolType || "ups";
        this.$data.accont.Type = newVal.Type;
        /* this.$data.instruct = Object.assign(
          this.$data.instruct,
          newVal.instruct[0]
        ); */
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
        let a = el.name !== "";
        let b = typeof el.regx == "string";
        let c = el.regx?.split("-").length == 2;
        let d = el.regx?.split("-").some(e => Number(e));
        let e = Number(el.bl);
        if (!a || !b || !c || !d || !e) {
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
      let accont = this.$data.accont;
      const instruct: protocolInstruct[] = this.$data.instructItems;

      this.$apollo
        .mutate({
          mutation: gql`
            mutation addorSet($arg: JSON) {
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
      title: "add Protocol"
    };
  }
});
</script>
