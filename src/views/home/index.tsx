import styles from "./index.less";
import { Button, Space, Modal, Alert } from "ant-design-vue";
import { onMounted, defineComponent, reactive } from "vue";
import CodeMirror from "@/components/Codemirror";
import { compile } from "@/utils/compile";
import { getTemplate, setTemplate } from "@/utils/template";

export default defineComponent({
  setup() {
    const form = reactive<{
      code: string;
      schema: string;
      template: string;
      md: string;
    }>({
      code: "",
      schema: "",
      template: "",
      md: "",
    });

    const visible = reactive<{ schema: boolean; template: boolean }>({
      schema: false,
      template: false,
    });

    const error = reactive<{ msg: string }>({
      msg: "",
    });

    onMounted(() => {
      if (window.utools) {
        utools.onPluginEnter((action) => {
          if (action.type === "regex") {
            form.code = action.payload;
            try {
              const data = compile(form.code);
              form.schema = JSON.stringify(data.schema, null, 4);
              form.md = data.markdown;
              error.msg = "";
            } catch (e) {
              console.log(e);
              error.msg = e.toString();
            }
          }
        });
      } else {
        form.code = `		  
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
		  `;
        const data = compile(form.code);
        form.schema = JSON.stringify(data.schema, null, 4);
        form.md = data.markdown;
      }
      form.template = getTemplate();
    });

    return () => (
      <div class={styles.home}>
        <div class={styles.container}>
          {!window.utools && (
            <>
              <Alert
                type="success"
                showIcon
                v-slots={{
                  message: (
                    <span>
                      已提供{" "}
                      <a href="https://u.tools/" target="_blank">
                        utools
                      </a>{" "}
                      插件，搜索 <a>typescript-to-markdown</a>
                    </span>
                  ),
                }}
              ></Alert>
              <div style={{ marginBottom: "10px" }}></div>
            </>
          )}
          {error.msg && (
            <>
              <Alert
                message="Error"
                description={error.msg}
                type="error"
                showIcon
              ></Alert>
              <div style={{ marginBottom: "10px" }}></div>
            </>
          )}
          <CodeMirror
            domId="typescript"
            value={form.code}
            mode="text/typescript"
            onChange={(value: string) => {
              form.code = value;
              try {
                const data = compile(form.code);
                form.schema = JSON.stringify(data.schema, null, 4);
                form.md = data.markdown;
                error.msg = "";
              } catch (e) {
                console.log(e);
                error.msg = e.toString();
              }
            }}
          />
          <div class={styles.btnWrapper}>
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  visible.schema = true;
                }}
              >
                查看Schema
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  visible.template = true;
                }}
              >
                修改模版
              </Button>
            </Space>
          </div>
          <CodeMirror
            domId="json"
            value={form.md}
            mode="application/json"
            onChange={(value: string) => {
              form.md = value;
            }}
          />
        </div>
        <Modal
          title="Schema"
          width="90%"
          visible={visible.schema}
          footer={null}
          onCancel={() => {
            visible.schema = false;
          }}
        >
          <CodeMirror
            domId="schema"
            value={form.schema}
            mode="application/json"
          />
        </Modal>
        <Modal
          title="模板"
          width="90%"
          visible={visible.template}
          okText="确定"
          cancelText="取消"
          onCancel={() => {
            visible.template = false;
          }}
          onOk={() => {
            setTemplate(form.template);
            visible.template = false;
          }}
        >
          <CodeMirror
            domId="template"
            value={form.template}
            mode="application/json"
            onChange={(value: string) => {
              form.template = value;
            }}
          />
        </Modal>
      </div>
    );
  },
});
