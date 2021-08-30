import { createApp } from "vue";
import App from "./App.vue";
import Home from "./views/home"
import router from "./router";
import "ant-design-vue/dist/antd.css";

createApp(Home).mount("#app");
