import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "@/views/home";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;

interface User {
  /**
   * @description 用户 id
   * @type {number}
   */
  id: number;
  /**
   * @description 昵称
   * @type {string}
   */
  nickname: string;
  // 真实姓名
  trueName: string;
  // 年龄
  age: string;
}
