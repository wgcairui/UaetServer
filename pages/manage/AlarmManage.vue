<template>
  <my-page title="告警管理">
    <b-row>
      <b-col>
        <b-table :items="infos" :fields="fields"></b-table>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue"
import { getInstance,WebInfo } from "../../store/DB"
import {BvTableFieldArray} from "bootstrap-vue/src/components/table"
export default Vue.extend({
  data(){
    return{
      infos:[] as WebInfo[],
      fields:[
        'id',
        {key:'time',label:'时间',sortable:true},
        {key:'type',label:'类型',sortable:true},
        {key:'msg',label:'消息'},
      ] as BvTableFieldArray
    }
  },
  methods:{
    async getInfos(){
     const result = await getInstance().queryAll<WebInfo>({tableName:'Infos'})
     this.infos = result
    }
  },
  mounted(){
    console.log(this.$route.params);
    this.getInfos()
  }
})
</script>
