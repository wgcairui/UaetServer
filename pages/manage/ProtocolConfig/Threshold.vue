<template>
  <my-page-manage title="协议参数阀值配置" :isUser="false">
    <b-row>
      <b-col>
        <separated title="添加参数阀值"></separated>
        <b-card>
          <b-form>
            <my-form label="属性:">
              <b-form-select v-model="Threshold.name" :options="items"></b-form-select>
            </my-form>
            <my-form label="最小值:">
              <b-form-input type="number" v-model="Threshold.min"></b-form-input>
            </my-form>
            <my-form label="最大值:">
              <b-form-input type="number" v-model="Threshold.max"></b-form-input>
            </my-form>
            <b-button
              size="sm"
              block
              variant="info"
              @click="addThreshold(Threshold, addModal)"
            >{{ addModal ? "Add" : "Modify" }}</b-button>
          </b-form>
        </b-card>
      </b-col>
    </b-row>
    <b-row v-if="Thresholds.length > 0">
      <b-col>
        <separated title="全部参数阀值"></separated>
        <b-card>
          <b-table-lite :items="Thresholds" :fields="ThresholdsFields">
            <template v-slot:cell(oprate)="data">
              <b-button-group size="sm">
                <b-button variant="info" @click="modifyThreshold(data.item)">修改</b-button>
                <b-button @click="deleteThreshold(data)">删除</b-button>
              </b-button-group>
            </template>
          </b-table-lite>
          <div class="text-center">
            <b-button size="sm" @click="pushThreshold(Thresholds)">提交</b-button>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </my-page-manage>
</template>

<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import {
  DevConstant_Air,
  protocol,
  DevConstant_EM,
  DevConstant_Ups,
  DevConstant_TH,
  protocolType,
  Threshold
} from "../../../server/bin/interface";
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      //
      addModal: true,
      Threshold: {
        name: "",
        min: 0,
        max: 0
      },
      Thresholds: [],
      ThresholdsFields: ["name", "min", "max", { key: "oprate", label: "操作" }]
    };
  },
  computed: {
    items() {
      if (this.addModal) {
        let ProtocolSingle: protocol = this.$data.ProtocolSingle;
        let i = 0;
        let result: any[] = [];
        if (ProtocolSingle) {
          ProtocolSingle.instruct.forEach(el => {
            el.formResize.forEach(ep => {
              if (!ep.isState && !this.ThresholdCache.has(ep.name)) {
                result.push({
                  text: `${i++}--${ep.name}`,
                  value: ep.name
                });
              }
            });
          });
        }
        return result;
      } else {
        return [this.$data.Threshold.name];
      }
    },
    // 阀值名称字段缓存
    ThresholdCache() {
      const Thresholds = this.Thresholds;
      let ThresholdCache: Set<string> = new Set();
      if (Thresholds) {
        Thresholds.forEach(({ name }) => ThresholdCache.add(name));
      }
      return ThresholdCache;
    }
  },

  watch: {
    "Threshold.name": function(newVal) {
      if (this.ThresholdCache.has(newVal)) {
        this.addModal = false;
      } else {
        this.addModal = true;
      }
    }
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
    Thresholds: {
      query: gql`
        query getDevConstant($Protocol: String) {
          Thresholds: getDevConstant(Protocol: $Protocol) {
            Threshold
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      },
      update: data => data.Thresholds.Threshold
    }
  },
  methods: {
    addThreshold(Threshold: Threshold, addModal: boolean) {
      if (Threshold.name === "" || Threshold.min > Threshold.max) {
        this.$bvToast.toast("参数错误", { title: "error", variant: "warn" });
        return;
      }
      let Thresholds: Threshold[] = this.Thresholds;
      const ThresholdCy = Object.assign({}, Threshold);
      if (!addModal) {
        Thresholds.forEach((el, index) => {
          if (el.name === ThresholdCy.name) {
            this.$set(Thresholds, index, ThresholdCy);
            this.ThresholdCache.add(ThresholdCy.name);
          }
        });
      } else {
        this.ThresholdCache.add(ThresholdCy.name);
        Thresholds.push(ThresholdCy);
      }
      this.Threshold.name = "";
      this.Threshold.min = 0;
      this.Threshold.max = 0;
    },
    modifyThreshold(Threshold: Threshold) {
      this.Threshold.name = Threshold.name;
      this.Threshold.min = Threshold.min;
      this.Threshold.max = Threshold.max;
    },
    deleteThreshold(data: any) {
      const { item, index }: { item: Threshold; index: number } = data;
      console.log(item.name);

      this.ThresholdCache.delete(item.name);
      this.Thresholds.splice(index, 1);
    },
    pushThreshold(Thresholds: Threshold[]) {
      const {
        ProtocolType,
        Protocol
      }: { ProtocolType: string; Protocol: string } = this.$data as any;
      this.$apollo
        .mutate({
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
          variables: {
            arg: Thresholds,
            Protocol,
            type: "Threshold",
            ProtocolType
          }
        })
        .then((res: any) => {
          const ok = res.data.addDevConstent.ok;
          if (ok > 0) {
            this.$bvToast.toast("配置success", {
              variant: "info",
              title: "Info"
            });
            this.$apollo.queries.Thresholds.refresh();
          }
        });
    }
  }
});
</script>

<style scoped></style>
