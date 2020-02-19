<template>
  <div>
    <my-head title="添加设备"></my-head>
    <b-container fluid>
      <b-row no-gutters>
        <b-col cols="12">
          <separated title="添加设备协议"></separated>
          <b-form class="p-3">
            <b-form-group label="协议类型：" v-bind="forGroup">
              <b-form-select v-model="accont.Type" :options="[485, 232]"></b-form-select>
            </b-form-group>
            <b-form-group label="协议设备类型：" v-bind="forGroup">
              <b-form-select
                v-model="accont.ProtocolType"
                :state="accont.ProtocolType !== ''"
                :options="[
                  { value: 'ups', text: 'UPS' },
                  { value: 'air', text: '空调' },
                  { value: 'em', text: '电量仪' },
                  { value: 'th', text: '温湿度' }
                ]"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="协议名称：" v-bind="forGroup">
              <b-form-input v-model="accont.Protocol" :state="accont.Protocol !== ''"></b-form-input>
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
          </b-table-lite>
          <b-button
            @click="submit"
            v-if="instructItems.length > 0"
            block
            variant="success"
            class="mb-3"
          >上传协议</b-button>
        </b-col>
      </b-row>

      <b-row no-gutters>
        <b-col>
          <separated title="添加协议指令"></separated>
          <b-card>
            <b-card-body>
              <b-form>
                <b-form-group label="指令字符：" v-bind="forGroup" :disabled="!instruct.addModel">
                  <b-form-input v-model="instruct.name" placeholder="QGS或者010300000002b5c0"></b-form-input>
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
                    >{{ instruct.shiftNum }}</b-form-checkbox>
                    <b-form-input
                      type="range"
                      max="5"
                      min="0"
                      v-model="instruct.shiftNum"
                      v-if="instruct.shift"
                    >2</b-form-input>
                  </b-input-group>
                </b-form-group>
                <b-form-group label="字符去尾处理:" v-bind="forGroup">
                  <b-input-group>
                    <b-form-checkbox v-model="instruct.pop" class="py-2 mr-3">
                      {{
                      instruct.popNum
                      }}
                    </b-form-checkbox>
                    <b-form-input
                      type="range"
                      max="10"
                      min="0"
                      v-model="instruct.popNum"
                      v-if="instruct.pop"
                    >2</b-form-input>
                  </b-input-group>
                </b-form-group>
                <b-form-group label="解析规则:" v-bind="forGroup">
                  <b-form-textarea
                    rows="1"
                    max-rows="150"
                    trim
                    v-model="instruct.resize"
                    placeholder="格式：变量名称+字符起始位置-几位字符+倍率+单位，没有倍率则略，例:市电输入+1-5，温度+4-8+0.1+%，每个变量以/分隔"
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
                >{{ instruct.addModel ? "添加指令" : "修改指令" }}</b-button>
              </b-form>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-row no-gutters>
        <b-col>
          <separated title="所有协议指令"></separated>
          <b-table-lite :items="Protocols" :fields="ProtocolsFields" responsive>
            <template v-slot:cell(instruct)="row">
              <b-button @click="row.toggleDetails">详情</b-button>
            </template>
            <template v-slot:cell(oprate)="data">
              <b-button @click="deleteProtocol(data.item)">delete</b-button>
            </template>
            <template v-slot:row-details="row">
              <b-card>
                <b-table-lite
                  responsive
                  :items="row.item.instruct"
                  :fields="[
                    'name',
                    'resultType',
                    'shift',
                    'shiftNum',
                    'pop',
                    'popNum',
                    'resize'
                  ]"
                ></b-table-lite>
              </b-card>
            </template>
          </b-table-lite>
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
    return {
      // from-group bind
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      accont: {
        Type: 485,
        Protocol: "卡乐控制器",
        ProtocolType: "air"
      },
      instruct: {
        name: "040001001b",
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
      Protocols: [],
      ProtocolsFields: ["Type", "Protocol", "instruct", "oprate"]
    };
  },
  computed: {
    // 解析规则分解为Json，{name:"aa",regx:"1-5",bl:"1",unit:"%"}
    formResize() {
      if (this.$data.instruct.resize == "") return [];
      const resize: string = this.$data.instruct.resize;

      let result: protocolInstructFormrize[] = resize
        .split("/")
        .filter((el) => el !== "")
        .map((el) => el.split("+"))
        .map((el) => ({
          name: el[0],
          regx: el[1] || null,
          bl: parseInt(el[2]) || 1,
          unit: el[3] || null,
          isState: el[3] && el[3].includes("{") ? true : false
        }));
      return result;
    },
    resize() {
      return <string>this.$data.instruct.resize;
    }
  },
  watch: {
    resize: function(newVal) {
      if (newVal.endsWith("/")) this.$data.instruct.resize += "\n";
    },
    // 监测协议是否重复，重复之后填充input
    apolloProtocol: function(newVal: protocol) {
      if (newVal) {
        newVal.instruct.forEach((el) => {
          this.$data.instructItems.push(el);
        });
        this.$data.accont.ProtocolType = newVal.ProtocolType || "ups";
        this.$data.accont.Type = newVal.Type;
        this.$data.instruct = Object.assign(
          this.$data.instruct,
          newVal.instruct[0]
        );
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
          Protocol(Protocol: $Protocol) {
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
      variables() {
        return {
          Protocol: this.$data.accont.Protocol
        };
      },
      update: (data) => data.Protocol
      /* skip() {
        this.accont.Protocol == "";
      } */
    },
    // 获取所有协议
    Protocols: gql`
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
    `
  },
  methods: {
    // 添加协议
    addInstruct() {
      const formResize: protocolInstructFormrize[] = this.$data.formResize;
      const regxBool = formResize.some(
        (el) =>
          el.name !== "" &&
          typeof el.regx == "string" &&
          el.regx.split("-").length == 2 &&
          el.regx.split("-").some((e) => Number(e)) &&
          Number(el.bl)
      );
      if (!regxBool) {
        this.$bvModal.msgBoxOk("参数效验错误");
        return;
      }
      const result: protocolInstruct = JSON.parse(
        JSON.stringify(
          Object.assign(this.$data.instruct, {
            formResize: this.$data.formResize
          })
        )
      );
      const instructItems: protocolInstruct[] = this.$data.instructItems;
      if (this.$data.instruct.addModel) {
        if (instructItems.some((val) => val.name == this.$data.instruct.name)) {
          this.$bvModal.msgBoxOk("指令名称重复");
          return;
        }

        this.$data.instructItems.push(result);
      } else
        instructItems.forEach((el, index) => {
          if (el.name == result.name) {
            instructItems[index] = Object.assign(instructItems[index], result);
            return;
          }
        });

      this.$data.instruct.addModel = true;
    },
    modify(data: any) {
      this.$data.instruct = Object.assign(this.$data.instruct, data.item, {
        addModel: false
      });
    },
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
    submit() {
      /* let accont = parseJsonToJson(this.$data.accont);
      const instructItems:protocolInstruct[] = this.$data.instructItems
      let instruct = instructItems.map((el) => {
        el.formResize = el.formResize.map((el2) => parseJsonToJson(el2));
        return parseJsonToJson(el);
      }); */
      let accont = this.$data.accont;
      const instructItems: protocolInstruct[] = this.$data.instructItems;
      let instruct = instructItems;

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
        .then(({ data }) => {
          this.$apollo.queries.Protocols.refresh();
          this.$bvModal.msgBoxOk(
            data.setProtocol.ok == 1 ? "上传协议成功" : "上传协议失败"
          );
        });
    },
    deleteProtocol(item: any) {
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
    }
  },
  head() {
    return {
      title: "add Protocol"
    };
  }
});
</script>
