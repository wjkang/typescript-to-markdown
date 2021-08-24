import { Layout } from "ant-design-vue";
import { FunctionalComponent } from "vue";

const LayoutComponent: FunctionalComponent<{ name: string }> = (
  props,
  context
) => {
  return <Layout>{context.slots.default && context.slots.default()}</Layout>;
};

export default LayoutComponent;
