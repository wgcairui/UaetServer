// 1. 确保在声明补充的类型之前导入 'vue'
import Vue from "vue";
import { CombinedVueInstance } from "vue/types/vue";
import VueRouter,{ Route } from "vue-router";
import {
  DollarApollo,
  ApolloClientMethods
} from "vue-apollo/types/vue-apollo";
import { VueApolloComponentOptions } from "vue-apollo/types/options";
import { Auth } from "nuxtjs__auth";
import { BvModal, BvToast } from "bootstrap-vue";
import * as SocketIOClient from 'socket.io-client';

// vue-socket.io-ex
type DefaultSocketHandlers<V> =  {
  [key: string]: (this: V, ...args: any[]) => any
};

// 2. 定制一个文件，设置你想要补充的类型
//    在 types/vue.d.ts 里 Vue 有构造函数类型
declare module "vue/types/vue" {
  // 3. 声明为 Vue 补充的东西
  interface Vue {
    $apollo: DollarApollo<this>;
    $auth: Auth;
    $socket: {
      client: SocketIOClient.Socket;
      $subscribe: (event: string, fn: Function) => void;
      $unsubscribe: (event: string) => void;
      connected: boolean;
      disconnected: boolean;
    };
    
  }
  interface VueConstructor {
    $apollo: DollarApollo<this>;
    $auth: Auth;
    $bvModal: BvModal;
    $bvToast: BvToast;
    $socket: {
      client: SocketIOClient.Socket;
      $subscribe: (event: string, fn: Function) => void;
      $unsubscribe: (event: string) => void;
      connected: boolean;
      disconnected: boolean;
    };
   /*  $router: VueRouter
    $route: Route */
  }
}
// type DataDef<Data, Props, V> = Data | ((this: Readonly<Props> & V) => Data);
declare module "vue/types/options" {
  interface ComponentOptions<
    V extends Vue,
    Data,
    Methods,
    Computed,
    PropsDef,
    Props
  > {
    apollo?: VueApolloComponentOptions<
      Data extends DataDef<infer D, any, any>
        ? CombinedVueInstance<V, D, Methods, Computed, Props>
        : CombinedVueInstance<V, Data, Methods, Computed, Props>
    >;
  }
  interface ComponentOptions<V extends Vue> {
    auth?: boolean | string;
    sockets?: DefaultSocketHandlers<V>
  }
}
