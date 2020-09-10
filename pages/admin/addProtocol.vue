<template>
  <b-row>
    <b-col>
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
          <separated title="指令集" :back="false"></separated>
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
          <b-button @click="submit" size="sm" block variant="success" class="mb-3">更新协议</b-button>
        </b-col>
      </b-row>
      <!--  -->
      <b-row no-gutters>
        <b-col>
          <separated title="添加协议指令" :back="false"></separated>
          <b-card>
            <b-card-body>
              <b-form>
                <my-form label="指令字符：">
                  <b-form-input
                    v-model="instruct.name"
                    :placeholder="Is232?'QGS or QMOD,不需要添加結束符\\n':'例:0300000001,不需要加地址碼和校驗碼'"
                  ></b-form-input>
                </my-form>
                <!--   <b-form-group v-bind="forGroup" :disabled="!instruct.addModel">
               
                </b-form-group>-->
                <my-form label="指令是否启用:">
                  <b-form-checkbox v-model="instruct.isUse" class="py-2 mr-3"></b-form-checkbox>
                </my-form>
                <my-form label="指令为非标协议:">
                  <b-form-checkbox v-model="instruct.noStandard" class="py-2 mr-3"></b-form-checkbox>
                </my-form>
                <b-collapse v-model="instruct.noStandard">
                  <my-form label="前处理脚本:">
                    <b-form-textarea
                      rows="1"
                      max-rows="150"
                      trim
                      v-model="instruct.scriptStart"
                      placeholder="默认参数有两个,为设备pid和指令名称,编写脚本以处理,function(pid,instruct){}"
                    ></b-form-textarea>
                  </my-form>

                  <my-form label="后处理脚本:">
                    <b-form-textarea
                      rows="1"
                      max-rows="150"
                      trim
                      v-model="instruct.scriptEnd"
                      placeholder="默认参数有一个,为BufferArray,使用Buffer.from()转换为buffer,编写脚本校验buffer，返回Boolen，,function(buffer){}"
                    ></b-form-textarea>
                  </my-form>
                </b-collapse>
                <my-form label="结果集:">
                  <b-form-select
                    :disabled="Is232"
                    v-model="instruct.resultType"
                    :options="Is232?['utf8']:['hex', 'float', 'short', 'HX','bit2']"
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
                      max="100"
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
                      max="100"
                      min="0"
                      v-model="instruct.popNum"
                      v-if="instruct.pop"
                    >2</b-form-input>
                  </b-input-group>
                </my-form>
                <my-form label="是否有分隔符:">
                  <b-form-checkbox v-model="instruct.isSplit" class="py-2 mr-3"></b-form-checkbox>
                </my-form>
                <my-form label="解析规则:">
                  <b-form-textarea
                    rows="1"
                    max-rows="150"
                    trim
                    v-model="instruct.resize"
                    placeholder="格式為:工作電壓+1-2+1+(V|{A:在線,B:離線}),加號為分隔符,第一位为参数名称,第二位1-2为从地址第一位开始读取两位长度数据,第三位为系数,获取的值乘系数为实际值,第四位为单位或者解析对象"
                  ></b-form-textarea>
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
    </b-col>
  </b-row>
</template>

<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
import deepmerge from "deepmerge";
import { protocolInstructFormrize, protocol, protocolInstruct } from "uart";
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
        shiftNum: 0,
        pop: false,
        popNum: 0,
        resize: "",
        addModel: true,
        isUse: true,
        isSplit: true,
        // 非标协议
        noStandard: false,
        // 前处理脚本
        scriptStart: 'function(pid,instruct){\n\n}',
        // 后处理脚本
        scriptEnd: 'function(buffer){\n\n}'
      },
      // 指令集
      instructItems: [] as protocol[],
      //
      instructItemsFields: [
        { key: "name", label: "名称" },
        { key: "isUse", label: "启用", formatter(val) { return val ? "启用" : "禁用" } },
        { key: 'isSplit', label: "分隔符", formatter(val) { return val ? "启用" : "禁用" } },
        { key: 'noStandard', label: '非标协议', formatter(val) { return val ? "是" : "否" } },
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
      ProtocolsFields: ["Type", "Protocol", "instruct", "oprate"] as BvTableFieldArray
    };
  },
  computed: {
    Is232() {
      return this.accont.Type !== 485
    },
    // 解析规则分解为Json，{name:"aa",regx:"1-5",bl:"1",unit:"%"}
    formResize() {
      if (this.$data.instruct.resize == "") return [];
      // resize = "系统1吸气温度+1-2+0.1+℃/送风温度+3-2+0.1+℃"
      const resize: string = this.$data.instruct.resize;
      // 分割字符串并刷选出有内容的 ["系统1吸气温度+1-2+0.1+℃","送风温度+3-2+0.1+℃"]
      const split = resize
        .replace(/(\n)/g, "")
        .split("&")
        .filter(el => el !== "");
      // 继续分割数组，为单个单位 [[[系统1吸气温度],[1-2],[0.1],[℃]"],[[送风温度],[3-2],[0.1],[℃]]]
      const resize1 = split.map(el => el.split("+"));
      // 构建数组对象 [{name:"aa",regx:"1-5",bl:"1",unit:"%"}]
      return resize1.map(el => ({
        name: el[0].replace(/(\n)/g, ""),
        regx: el[1],
        bl: el[2] || '1',
        unit: el[3] || '',
        isState: /(^{.*}$)/.test(el[3]) //el[3]?.includes("{")
      } as protocolInstructFormrize)
      );
    }
  },
  watch: {
    // 检测到"&"，字符自动换行
    "instruct.resize": function (newVal) {
      if (newVal.endsWith("&")) this.$data.instruct.resize += "\n";
    },
    // 检测类型以去除头尾
    "accont.Type": function (newVal) {
      const instruct = this.instruct;
      switch (newVal) {
        case 485:
          instruct.shift = true;
          instruct.pop = true;
          instruct.shiftNum = 3;
          instruct.popNum = 2;
          instruct.isSplit = false
          instruct.resultType = 'hex'
          break;
        case 232:
          instruct.shift = true;
          instruct.pop = true;
          instruct.shiftNum = 1;
          instruct.popNum = 1;
          instruct.isSplit = true
          instruct.resultType = 'utf8'
          break;
      }
    },
    // 监测协议是否重复，重复之后填充input
    apolloProtocol: function (newVal: protocol) {
      if (newVal) {
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
              isUse
              isSplit
              name
              resultType
              shift
              shiftNum
              pop
              popNum
              resize
              formResize
              noStandard
              scriptStart
              scriptEnd
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
        const isreg = el.regx && /(^[0-9]{1,2}-[1-9])/.test(el.regx);
        const e = Number(el.bl) || /^\(.*\)$/.test(el.bl);
        if (!a || !isreg || !e) {
          this.$bvModal.msgBoxOk("参数效验错误" + a + isreg + e);
          return;
        }
      }
      const instruct: protocolInstruct = this.$data.instruct;
      instruct.name = instruct.name.replace(/\s*/g, "");
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
            instructItems.splice(index, 1, result)
            //instructItems[index] = result;
            this.$bvModal.msgBoxOk(`更新指令${instructItems[index].name} success`);
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
      this.$bvModal.msgBoxConfirm(`确定要删除指令:${data.item.name}吗??`).then(() => {
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
    async submit() {
      //
      const accont = this.$data.accont;
      const instruct: protocolInstruct[] = this.$data.instructItems;

      await this.$apollo.mutate({
        mutation: gql`
            mutation addProtocolSet($arg: JSON) {
              setProtocol(arg: $arg) {
                msg
                ok
              }
            }
          `,
        variables: { arg: Object.assign(accont, { instruct }) }
      })
        .then(({ data }: { data: any }) => {
          this.$bvModal.msgBoxOk(data.setProtocol.ok == 1 ? "上传协议成功" : "上传协议失败");

        });
      this.$apollo.queries.apolloProtocol.refresh()
    }
  },
  head() {
    return {
      title: "添加协议"
    };
  }
});
</script>
