import styles from "./index.less";
import { Button, Space, Modal } from "ant-design-vue";
import { onMounted, defineComponent, reactive } from "vue";
import CodeMirror from "@/components/Codemirror";
import { compile } from "@/utils/compile";

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

    onMounted(() => {
      if (window.utools) {
        utools.onPluginEnter((action) => {
          if (action.type === "regex") {
            form.code = action.payload;
            try {
              const data = compile(form.code);
              form.schema = JSON.stringify(data.schema, null, 4);
              form.md = data.markdown;
            } catch (e) {
              console.log(e);
            }
          }
        });
      }
    });

    return () => (
      <div class={styles.home}>
        <div class={styles.container}>
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
              } catch (e) {
                console.log(e);
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
                查看Schame
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
      </div>
    );
  },
});
