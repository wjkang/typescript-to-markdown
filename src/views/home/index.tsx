import LayoutComponent from "@/layout/default";
import styles from "./index.less";
import * as recast from "recast";
import * as typescriptParse from "recast/parsers/typescript";
import { onMounted, defineComponent } from "vue";

export default defineComponent({
  setup() {
    onMounted(() => {
      console.log(121212);
      // Let's turn this function declaration into a variable declaration.
      const code = `
	  export type ITableClick<T = any> = (data: {
		/**
		 * @description 按钮对应列的 title
		 * @type {string}
		 */
		title: string;
		type?: 'button' | 'clickable';
		/**
		 * @description 按钮 label
		 * @type {string}
		 */
		label: string;
		/**
		 * @description 行数据
		 * @type {T}
		 */
		data: T;
	  }) => void;
	  `;

      // Parse the code using an interface similar to require("esprima").parse.
      const ast = recast.parse(code, { parser: typescriptParse });
    });
    return () => (
      <div class={styles.home}>
        <LayoutComponent name="121212">
          <div class={styles.containerTest21212}>1212</div>
        </LayoutComponent>
      </div>
    );
  },
});
