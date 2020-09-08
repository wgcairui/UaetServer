<template>
  <b-row>
    <b-col>
      <b-row>
        <b-col>
          <separated title="添加参数状态"></separated>
          <b-card>
            <b-form>
              <!-- <my-form label="属性:">
                <b-form-select v-model="selectNames" :options="items" multiple></b-form-select>
              </my-form>
              <my-form label="正常值:">
                <b-form-select v-model="State.alarmStat" :options="itemAlarm" multiple></b-form-select>
              </my-form>
              <b-button size="sm" block variant="info" @click="addState(selectNames)">add</b-button>-->
              <label class="m-3">
                <h5>Tips:</h5>
                <b>设备运行的参数值不在选中的状态将会触发告警</b>
              </label>
              <b-list-group>
                <b-list-group-item
                  v-for="(row,key) in AlarmStatItems"
                  :key="key+'12098'"
                  class="d-flex"
                >
                  <span>{{row.name}}</span>
                  <div class="ml-auto">
                    <label v-for="(val,key) in row.show" :key="key" class="mx-1">
                      <input
                        class
                        name="Fruit"
                        :checked="row.alarmStat.includes(val.value)"
                        type="checkbox"
                        :value="val.value"
                        @change="StateAlarmSelects(row,val.value)"
                      />
                      {{val.text}}
                    </label>
                  </div>
                </b-list-group-item>
              </b-list-group>
            </b-form>
          </b-card>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { queryResultArgument, protocol, ConstantAlarmStat } from "uart";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      //
      addModal: true,
      State: { name: "", value: "", unit: "{0:正常,1:报警}", alarmStat: [0] },
      selectNames: [] as ConstantAlarmStat[],
      States: [] as ConstantAlarmStat[],
      StatesFields: [
        "name",
        { key: "alarmStat", formatter: (a, b, item) => (<any>this).formet(item) },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray
    };
  },
  computed: {
    /* items() {
      const ProtocolSingle: protocol = this.$data.ProtocolSingle;
      const States = this.States;
      const names = States.map(el => el.name);
      let i = 0;
      let result: any[] = [];
      if (ProtocolSingle) {
        result = ProtocolSingle.instruct.map(el => {
          return el.formResize
            .filter(el2 => el2.isState && !names.includes(el2.name)).map(el3 => ({
              text: `${i++}--${el3.name}`,
              value: Object.assign(el3, { alarmStat: [0] })
            }));
        }).flat();
      }
      return result;
    }, */
    // 参数状态
    AlarmStatItems() {
      const ProtocolSingle: protocol = this.$data.ProtocolSingle;
      const DevConstant = this.States
      let result: any[] = [];
      // 如果协议单例存在
      if (ProtocolSingle) {
        // 转换系统和用户的配置为Map，如果未定义则填入空数组
        const MapSys = new Map(DevConstant ? DevConstant.map(el => [el.name, el]) : []);
        //console.log({a:this.States,MapSys});

        // 迭代协议参数值，取出状态值，把unit转为obj，如果参数有定义监控则写入监控，优先使用用户定义
        result = ProtocolSingle.instruct
          .map(el => {
            return el.formResize
              .filter(el2 => el2.isState)
              .map(el3 => {
                const show = (<string>el3.unit)
                  .replace(/(\{|\}| )/g, "")
                  .split(",")
                  .map(el4 => el4.split(":"))
                  .map(el5 => ({ text: el5[1], value: Number(el5[0]) }));
                const alarmStat = MapSys.get(el3.name)?.alarmStat;
                return {
                  name: el3.name,
                  show,
                  alarmStat: Array.from(new Set(alarmStat || []))
                };
              });
          })
          .flat();
      }
      //console.log(result);

      return result;
    },
    itemAlarm() {
      const value = this.$data.selectNames[0] || this.$data.State;
      return (<string>value.unit)
        .replace(/(\{|\}| )/g, "")
        .split(",")
        .map(el => el.split(":"))
        .map(el => ({ text: el[1], value: Number(el[0]) }));
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
    States: {
      query: gql`
        query getDevConstant($Protocol: String) {
          States: getDevConstant(Protocol: $Protocol) {
            AlarmStat {
              name
              unit
              alarmStat
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      },
      update: data => data.States.AlarmStat
    }
  },
  methods: {
    formet(item: ConstantAlarmStat) {
      const arr = (<string>item.unit).replace(/(\{|\}| )/g, "")
        .split(",")
        .map(el => el.split(":"))
        .map(el => ({ [Number(el[0])]: el[1] }));
      const obj = Object.assign({}, ...arr);
      return item.alarmStat.map(el => obj[el]);
    },
    async StateAlarmSelects(item: ConstantAlarmStat, value: number) {
      const StatSet = new Set(item.alarmStat);
      if (StatSet.has(value)) {
        StatSet.delete(value);
      } else {
        StatSet.add(value);
      }
      item.alarmStat = Array.from(StatSet);

      const AlarmStat = this.AlarmStatItems;
      this.pushThreshold(AlarmStat, "AlarmStat");
    },
    // 统一提交配置
    async pushThreshold(
      arg: Threshold[] | string[],
      type: ConstantThresholdType
    ) {
      const isOk = await this.$apollo.mutate({
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
          arg,
          Protocol: this.Protocol,
          type,
          ProtocolType: this.ProtocolType
        }
      });
      this.$apollo.queries.States.refetch();
    }
  }
  /* addState(selectNames: ConstantAlarmStat[]) {
    const AlarmStats = this.States;
    const State = this.State
    selectNames.forEach(S => {
      const n = AlarmStats.findIndex(el => el.name === S.name);
      S.alarmStat = State.alarmStat
      if (n === -1) {
        AlarmStats.push(S);
      } else AlarmStats[n] = S;
    });
  },
  deleteState(data: any) {
    const { item, index }: { item: ConstantAlarmStat; index: number } = data;
    this.States.splice(index, 1);
  },
  pushState(AlarmStats: ConstantAlarmStat[]) {
    const { ProtocolType, Protocol }: { ProtocolType: string; Protocol: string } = this.$data as any;
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
      variables: { arg: AlarmStats, Protocol, type: "AlarmStat", ProtocolType }
    })
      .then((res: any) => {
        const ok = res.data.addDevConstent.ok;
        if (ok > 0) {
          this.$bvToast.toast("配置success", { variant: "info", title: "Info" });
          this.$apollo.queries.States.refetch();
        }
      });
  }
} */
});
</script>

<style scoped></style>
