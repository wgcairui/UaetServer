module.exports = {
  mode: "spa",
  server: {
    host: process.env.NODE_ENV === "production" ? "116.62.48.175" : "0.0.0.0",
    port: 9010
  },
  vue: {
    config: {
      silent: true
    }
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
  css: ["~/assets/iconfont.css"],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [{ src: "~/plugins/tree.js", ssr: false }],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    "@nuxtjs/eslint-module",
    // Doc: https://github.com/nuxt-community/stylelint-module
    "@nuxtjs/stylelint-module",
    "@nuxt/typescript-build"
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
    tokenName: "Uart", // optional, default: apollo-token
    cookieAttributes: {
      /**
       * Define when the cookie will be removed. Value can be a Number
       * which will be interpreted as days from time of creation or a
       * Date instance. If omitted, the cookie becomes a session cookie.
       */
      expires: 7, // optional, default: 7 (days)

      /**
       * Define the path where the cookie is available. Defaults to "/"
       */
      path: "/", // optional
      /**
       * Define the domain where the cookie is available. Defaults to
       * the domain of the page where the cookie was created.
       */
      domain: "example.com", // optional

      /**
       * A Boolean indicating if the cookie transmission requires a
       * secure protocol (https). Defaults to false.
       */
      secure: false
    },
    includeNodeModules: true, // optional, default: false (this includes graphql-tag for node_modules folder)
    authenticationType: "Basic", // optional, default: "Bearer"
    // (Optional) Default "apollo" definition
    defaultOptions: {
      // See "apollo" definition
      // For example: default query options
      $query: {
        loadingKey: "loading",
        fetchPolicy: "cache-and-network"
      }
    },
    // required
    clientConfigs: {
      default: {
        // required
        httpEndpoint: "http://127.0.0.1:9010",
        // optional
        // override HTTP endpoint in browser only
        browserHttpEndpoint: "/graphql",
        // optional
        // See https://www.apollographql.com/docs/link/links/http.html#options
        httpLinkOptions: {
          credentials: "same-origin"
        },
        // You can use `wss` for secure connection (recommended in production)
        // Use `null` to disable subscriptions
        // wsEndpoint: "ws://127.0.0.1:9010", // optional
        // LocalStorage token
        tokenName: "apollo-token" // optional
        // Enable Automatic Query persisting with Apollo Engine
        // persisting: false, // Optional
        // Use websockets for everything (no HTTP)
        // You need to pass a `wsEndpoint` for this to work
        // websocketsOnly: false // Optional
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
    extend(config, ctx) { }
  },
  router: {
    middleware: ["auth"]
  }
};
