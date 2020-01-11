<template>
  <div>
    <my-head title="添加设备"></my-head>
    <separated title="添加设备协议"></separated>
    <b-form class="p-3">
      <b-form-group label="协议类型：" v-bind="forGroup">
        <b-form-select
          v-model="accont.Type"
          :options="[485, 232]"
        ></b-form-select>
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
        <b-form-input
          v-model="accont.Protocol"
          :state="accont.Protocol !== ''"
        ></b-form-input>
      </b-form-group>
    </b-form>
    <separated title="指令集"></separated>
    <b-table-lite
      responsive
      ref="table1"
      id="my-table1"
      :items="instructItems"
      :fields="instructItemsFields"
    >
      <template v-slot:cell(formResize)="row">
        <b-button type="link" @click="row.toggleDetails">查看</b-button>
      </template>
      <template v-slot:row-details="row">
        <b-card>
          <b-table
            stacked
            :items="row.item.formResize"
            :fields="instructResultFields"
          ></b-table
        ></b-card>
      </template>
      <template v-slot:cell(oprate)="data">
        <b-button-group>
          <b-button variant="info" @click="modify(data)">修改</b-button>
          <b-button variant="danger" @click="rm(data)">删除</b-button>
        </b-button-group>
      </template>
    </b-table-lite>
    <b-button
      @click="submit"
      v-if="instructItems.length > 0"
      block
      variant="success"
      class=" mb-3 "
      >上传协议</b-button
    >
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
              <b-form-checkbox v-model="instruct.shift" class="py-2 mr-3">{{
                instruct.shiftNum
              }}</b-form-checkbox>
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
              <b-form-checkbox v-model="instruct.pop" class="py-2 mr-3">{{
                instruct.popNum
              }}</b-form-checkbox>
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
              trim
              v-model="instruct.resize"
              placeholder="格式：变量名称+字符起始位置-几位字符+倍率+单位，没有倍率则略，例:市电输入+1-5，温度+4-8+0.1+%，每个变量以/分隔"
            ></b-form-textarea>
          </b-form-group>
          <b-form-group label="解析结果:" v-bind="forGroup">
            <b-table-lite
              responsive
              bordered
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
  </div>
</template>

<script>
import MyHead from "@/components/MyHead";
import separated from "~/components/separated";
import gql from "graphql-tag";
import { parseJsonToJson } from "@/plugins/tools";
export default {
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
      if (this.instruct.resize == "") return [];
      return this.instruct.resize
        .toString()
        .split("/")
        .filter((el) => el !== "")
        .map((el) => el.split("+"))
        .map((el) => ({
          name: el[0],
          regx: el[1] || null,
          bl: el[2] || 1,
          unit: el[3] || null
        }));
    }
  },
  watch: {
    // 监测协议是否重复，重复之后填充input
    apolloProtocol: function(newVal) {
      if (newVal) {
        newVal.instruct.forEach((el) => {
          this.instructItems.push(el);
        });
        this.accont.Type = newVal.Type;
        this.instruct = Object.assign(this.instruct, newVal.instruct[0]);
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
          Protocol: this.accont.Protocol
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
      let regxBool = this.formResize.some(
        (el) =>
          el.name !== "" &&
          el.regx.split("-").length == 2 &&
          el.regx.split("-").some((e) => Number(e)) &&
          Number(el.bl)
      );
      if (!regxBool) return this.$bvModal.msgBoxOk("参数效验错误");
      let result = JSON.parse(
        JSON.stringify(
          Object.assign(this.instruct, { formResize: this.formResize })
        )
      );
      if (this.instruct.addModel) {
        if (this.instructItems.some((val) => val.name == this.instruct.name))
          return this.$bvModal.msgBoxOk("指令名称重复");
        this.instructItems.push(result);
      } else
        this.instructItems.forEach((el, index) => {
          if (el.name == result.name) {
            this.instructItems[index] = Object.assign(
              this.instructItems[index],
              result
            );
            return;
          }
        });

      this.instruct.addModel = true;
    },
    modify(data) {
      this.instruct = Object.assign(this.instruct, data.item, {
        addModel: false
      });
    },
    rm(data) {
      this.$bvModal
        .msgBoxConfirm(`确定要删除指令:${data.item.name}吗??`)
        .then(() => {
          this.instructItems.forEach((el, index) => {
            if (el.name == data.item.name) {
              this.instructItems.splice(index, 1);
              return;
            }
          });
        });
    },
    submit() {
      let accont = parseJsonToJson(this.accont);
      let instruct = this.instructItems.map((el) => {
        el.formResize = el.formResize.map((el2) => parseJsonToJson(el2));
        return parseJsonToJson(el);
      });

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
            data.data.setProtocol.ok == 1 ? "上传协议成功" : "上传协议失败"
          );
        });
    },
    deleteProtocol(item) {
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
};
</script>
