<template>
  <my-page-manage title="协议参数状态配置" :isUser="false">
    <b-row>
      <b-col>
        <separated title="添加参数状态"></separated>
        <b-card>
          <b-form>
            <my-form label="属性:">
              <b-form-select v-model="selectNames" :options="items" multiple></b-form-select>
            </my-form>
            <my-form label="正常值:">
              <b-form-select v-model="State.alarmStat" :options="itemAlarm" multiple></b-form-select>
            </my-form>
            <b-button size="sm" block variant="info" @click="addState(selectNames)">add</b-button>
          </b-form>
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <separated title="全部参数状态"></separated>
        <b-card>
          <b-table-lite :items="States" :fields="StatesFields">
            <template v-slot:cell(oprate)="data">
              <b-button-group size="sm">
                <b-button @click="deleteState(data)">删除</b-button>
              </b-button-group>
            </template>
          </b-table-lite>
          <div class="text-center">
            <b-button block size="sm" @click="pushState(States)">提交</b-button>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </my-page-manage>
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
      State: {
        name: "",
        value: "",
        unit: "{0:正常,1:报警}",
        alarmStat: [0]
      },
      selectNames:[] as ConstantAlarmStat[],
      States: [] as ConstantAlarmStat[],
      StatesFields: [
        "name",
        {
          key: "alarmStat",
          formatter: (a, b, item) => (<any>this).formet(item)
        },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray
    };
  },
  computed: {
    items() {
      const ProtocolSingle: protocol = this.$data.ProtocolSingle;
      const States = this.States;
      const names = States.map(el => el.name);
      let i = 0;
      let result: any[] = [];
      if (ProtocolSingle) {
        result = ProtocolSingle.instruct
          .map(el => {
            return el.formResize
              .filter(el2 => el2.isState && !names.includes(el2.name))
              .map(el3 => ({
                text: `${i++}--${el3.name}`,
                value: Object.assign(el3, { alarmStat: [0] })
              }));
          })
          .flat();
      }
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
      const arr = (<string>item.unit)
        .replace(/(\{|\}| )/g, "")
        .split(",")
        .map(el => el.split(":"))
        .map(el => ({ [Number(el[0])]: el[1] }));
      const obj = Object.assign({}, ...arr);
      return item.alarmStat.map(el => obj[el]);
    },
    addState(selectNames: ConstantAlarmStat[]) {
      const AlarmStats = this.States;
      const State = this.State
      selectNames.forEach(S => {
        const n = AlarmStats.findIndex(el => el.name === S.name);
        S.alarmStat = State.alarmStat
        if (n === -1) {
          AlarmStats.push(S);
        } else AlarmStats[n] = S;
      });
      /* const n = AlarmStats.findIndex(el => el.name === State.name);
      if (n === -1) {
        AlarmStats.push(State);
      } else AlarmStats[n] = State; */
    },
    deleteState(data: any) {
      const { item, index }: { item: ConstantAlarmStat; index: number } = data;
      this.States.splice(index, 1);
    },
    pushState(AlarmStats: ConstantAlarmStat[]) {
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
            arg: AlarmStats,
            Protocol,
            type: "AlarmStat",
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
            this.$apollo.queries.States.refetch();
          }
        });
    }
  }
});
</script>

<style scoped></style>
