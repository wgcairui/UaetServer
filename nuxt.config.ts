import { Configuration } from "@nuxt/types"
const isProd = process.env.NODE_ENV === "production"
const Config = {
  mode: "spa",
  // mode: "universal",
  server: {
    host: isProd ? "0.0.0.0" : "0.0.0.0",
    port: isProd ? 9010 : 3000
  },
  /*
   ** Headers of the page
   */
  head: {
    title: process.env.npm_package_name || "",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content: process.env.npm_package_description || ""
      }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#fff" },
  /*
   ** Global CSS
   */
  css: ["~/assets/iconfont.css","~/assets/main.css"],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    { src: "~/plugins/vue-socket.io-extended.ts", ssr: false },
    "~/plugins/compontent.js"
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    /*  // Doc: https://github.com/nuxt-community/eslint-module
    "@nuxtjs/eslint-module",
    // Doc: https://github.com/nuxt-community/stylelint-module
    "@nuxtjs/stylelint-module", */
    ["@nuxt/typescript-build", { typeCheck: false }]
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://bootstrap-vue.js.org
    "bootstrap-vue/nuxt",
    // Doc: https://axios.nuxtjs.org/usage
    "@nuxtjs/axios",
    // https://npm.taobao.org/package/%40nuxtjs%2Fapollo
    "@nuxtjs/apollo",
    // https://auth.nuxtjs.org/
    "@nuxtjs/auth",
    // https://nuxt-community.github.io/nuxt-i18n/basic-usage.html#nuxt-link
    "nuxt-i18n"
  ],
  //
  i18n: {
    locales: [
      {
        code: "en",
        name: "English",
        iso: "en-US"
      },
      {
        code: "zh",
        name: "简体中文",
        iso: "zh-CN"
      }
    ],
    defaultLocale: "zh",
    vueI18n: {
      fallbackLocale: "zh",
      messages: {
        en: require("./locales/en.json"),
        zh: require("./locales/zh.json")
      }
    },
    // Routes generation strategy, can be set to one of the following:
    // - 'no_prefix': routes won't be prefixed
    // - 'prefix_except_default': add locale prefix for every locale except default
    // - 'prefix': add locale prefix for every locale
    // - 'prefix_and_default': add locale prefix for every locale and default
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true,
      cookieKey: "UartServer_i18n"
    }
  },
  // axios
  axios: {
    proxy: true, // Can be also an object with default options
    // baseURL: process.env.NODE_ENV === "production" ? "116.62.48.175" : "localhost"
    // proxy: true,
    credentials: true
  },
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  // https://auth.nuxtjs.org/schemes/local.html
  auth: {
    strategies: {
      local: {
        endpoints: {
          login: {
            url: "/api/auth/login",
            method: "post",
            propertyName: "token"
          },
          logout: { url: "/api/auth/logout", method: "post" },
          user: { url: "/api/auth/user", method: "get", propertyName: "user" }
        },
        tokenRequired: true,
        tokenType: "bearer"
      }
    },
    redirect: {
      login: "/login",
      logout: "/login",
      // callback: '/admin/edit',
      home: "/"
    }
  },
  // Give apollo module options
  apollo: {
    tokenName: "Uart",
    cookieAttributes: {
      expires: 7,
      path: "/",
      domain: "example.com",
      secure: false
    },
    includeNodeModules: true,
    authenticationType: "Basic",
    defaultOptions: {
      $query: {
        loadingKey: "loading",
        fetchPolicy: "cache-and-network"
      }
    },
    clientConfigs: {
      default: {
        httpEndpoint: "http://127.0.0.1:9010",
        browserHttpEndpoint: "/graphql",
        httpLinkOptions: {
          credentials: "same-origin"
        },
        tokenName: "apollo-token"
      }
    }
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        (config as any).module.rules.push({
          enforce: "pre",
          test: /\.(js|vue)$/,
          loader: "eslint-loader",
          exclude: /(node_modules)/
        })
      }
    }
  },
  router: {
    middleware: ["auth", 'checkSocketIO']
  },
  typescript: {
    typeCheck: {
      eslint: true
    }
  }
} as Configuration

export default Config