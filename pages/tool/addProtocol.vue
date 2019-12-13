<template>
  <div>
    <b-form>
      <b-form-group label="协议类型：" v-bind="forGroup">
        <b-form-select
          v-model="accont.Type"
          :options="[485, 232]"
        ></b-form-select>
      </b-form-group>
      <b-form-group label="协议名称：" v-bind="forGroup">
        <b-form-input v-model="accont.Protocol"></b-form-input>
      </b-form-group>
    </b-form>
    <b-table-lite
      responsive
      :items="instructItems"
      :fields="instructItemsFields"
    >
      <template v-slot:cell(oprate)="data">
        <b-button-group>
          <b-button variant="info" @click="modify(data)">修改</b-button>
          <b-button variant="dran" @click="rm(data)">删除</b-button>
        </b-button-group>
      </template>
    </b-table-lite>
    <b-card sub-title="添加协议指令">
      <b-card-body>
        <b-form>
          <b-form-group label="指令字符：" v-bind="forGroup">
            <b-form-input
              v-model="instruct.name"
              placeholder="QGS或者010300000002b5c0"
            ></b-form-input>
          </b-form-group>
          <b-form-group label="结果集:" v-bind="forGroup">
            <b-form-select
              v-model="instruct.resultType"
              :options="['hex', 'utf8']"
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
              placeholder="格式：变量名称+字符起始位置-几位字符+倍率，没有倍率则略，例:市电输入+1-5，温度+4-8+0.1，每个变量以/分隔"
            ></b-form-textarea>
          </b-form-group>
          <b-button @click="addInstruct">添加指令</b-button>
        </b-form>
      </b-card-body>
    </b-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      accont: {
        Type: 485,
        Protocal: ""
      },
      instruct: {
        name: "",
        resultType: "hex",
        shift: false,
        shiftNum: 1,
        pop: false,
        popNum: 1,
        resize: ""
      },
      instructItems: [],
      instructItemsFields: [
        { key: "name", label: "名称" },
        { key: "resultType", label: "结果集" },
        { key: "shift", label: "字符去头" },
        { key: "shiftNum", label: "去头数" },
        { key: "pop", label: "字符去尾" },
        { key: "popNum", label: "去尾数" },
        { key: "resize", label: "解析规则" },
        { key: "oprate", label: "操作" }
      ]
    };
  },
  methods: {
    addInstruct() {
      if (this.instructItems.some((val) => val.name == this.instruct.name))
        return this.$bvModal.msgBoxOk("指令名称重复");
      this.instructItems.push(JSON.parse(JSON.stringify(this.instruct)));
    },
    modify(data) {
      console.log(data);
    },
    rm(data) {
      console.log(data);
    }
  }
};
</script>
