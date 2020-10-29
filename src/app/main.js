import Vue from "vue";
import app from "./app.vue";
import router from "./router";

import VueSocketIO from "vue-socket.io";

Vue.use(
  new VueSocketIO({
    connection: "",
    options: {
      transports: [/*"websocket", */ "polling"],
      query: {
        token: "guest"
      }
    }
  })
);

new Vue({
  el: "#app",
  router,
  render: h => h(app)
});
