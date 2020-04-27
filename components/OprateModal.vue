<template>
  <div>
    <b-modal ref="modals" :title="arg.oprateName" button-size="sm" size="lg">
      <b-row>
        <b-col>
          <b-button
            v-for="(obj,key) in arg.oprateSelect"
            :key="key"
            @click="OprateInstruct(obj)"
            class="m-3"
          >{{obj.key}}</b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-overlay :show="show">
            <b-card>
              <p>
                <b>状态码:</b>
                {{ok}}
              </p>
              <p>
                <b>返回值:</b>
                {{msg}}
              </p>
            </b-card>
          </b-overlay>
        </b-col>
      </b-row>
    </b-modal>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {
  queryResultArgument,
  TerminalMountDevs,
  instructQueryArg,
  ApolloMongoResult
} from "../server/bin/interface";
import gql from "graphql-tag";
export default Vue.extend({
  props: {
    oprate: {
      type: Boolean,
      default: false
    },
    oprateArg: {
      default: Object
    }
  },
  data() {
    return {
      ok: 0,
      msg: "",
      show:false
    };
  },
  computed: {
    o() {
      return this.oprate;
    },
    arg() {
      const argument = { oprateName: "", oprateSelect: [] as any[] };
      const oprateArg = this.oprateArg as {
        item: queryResultArgument;
        query: TerminalMountDevs;
      };
      if (oprateArg) {
        const unitArray = (oprateArg.item.unit as string)
          .replace(/(\{|\}| )/g, "")
          .split(",");
        // 缓存到arg Map
        unitArray.forEach(el => {
          const [value, key] = el.split(":");
          argument.oprateSelect.push({ key, value });
        });
        argument.oprateName = oprateArg.item.name;
      }
      return argument;
    }
  },
  watch: {
    o: function(val) {
      if (val) {
        (this.$refs as any)["modals"].show();
        this.ok = 0
        this.msg = ''
      } else {
        (this.$refs as any)["modals"].hide();
      }
    }
  },
  methods: {
    async OprateInstruct(obj: { key: string; value: string }) {
      // 获取指令状态
      const valNum = parseInt(obj.value);
      // 如果小于0,翻转数据
      const valArr = valNum < 0 ? [255, valNum + 256] : [0, valNum];
      const oprateArg = this.oprateArg as {
        item: queryResultArgument;
        query: any;
      };
      const arg = Object.assign(
        oprateArg.item,
        oprateArg.query
      ) as instructQueryArg;
      this.show = true
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation SendProcotolInstruct($arg: JSON, $value: [Int]) {
            SendProcotolInstruct(arg: $arg, value: $value) {
              ok
              msg
            }
          }
        `,
        variables: {
          arg,
          value: valArr
        }
      });
      const R = result.data.SendProcotolInstruct as ApolloMongoResult;
      this.ok = R.ok;
      this.msg = R.msg;
      this.show = false
    }
  }
});
</script>