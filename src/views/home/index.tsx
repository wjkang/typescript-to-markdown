import LayoutComponent from "@/layout/default";
import styles from "./index.less";
import * as recast from "recast";
import { namedTypes as n, visit } from "ast-types";
import * as typescriptParse from "recast/parsers/typescript";
import { onMounted, defineComponent } from "vue";

export default defineComponent({
  setup() {
    onMounted(() => {
      // Let's turn this function declaration into a variable declaration.
      const code = `
	  type b<T=any>={
		coverRight?: boolean;
		children?: React.ReactNode;
		// dsdsd
		//ewewe
		contentPadding?: {a:string};
		contentPadding2?: {b:string};
	  };
	  `;

      const schema: {
        name?: string;
        typeParameters?: { name?: string; default?: string }[];
        properties?: {
          name?: string;
          optional?: boolean;
          type?: string;
          comments?: string[];
        }[];
      }[] = [];

      const getCurrentSchema = () => {
        return schema[schema.length - 1];
      };

      const getCurrentTypeParameter = () => {
        const typeParameters = schema[schema.length - 1].typeParameters!;
        const typeParameter = typeParameters[typeParameters.length - 1];
        return typeParameter;
      };

      const getCurrentProperty = () => {
        const properties = schema[schema.length - 1].properties!;
        return properties[properties.length - 1];
      };

      const isTopListeral = (path: any) => {
        return n.TSTypeAliasDeclaration.check(path.parent.node);
      };

      const ast = recast.parse(code, { parser: typescriptParse });
      visit(ast, {
        visitExportNamedDeclaration(path) {
          this.traverse(path);
        },
        // 处理 type 声明的类型
        visitTSTypeAliasDeclaration(path) {
          schema.push({});
          this.traverse(path);
          console.log(JSON.stringify(schema, null, 4));
        },
        visitTSTypeLiteral(path) {
          if (!isTopListeral(path)) {
            schema.push({
              name: getCurrentProperty().name,
            });
          }
          this.traverse(path);
        },
        // 处理泛型参数
        visitTSTypeParameter(path) {
          if (n.TSTypeParameterDeclaration.check(path.parent.node)) {
            if (!schema[schema.length - 1].typeParameters?.length) {
              schema[schema.length - 1].typeParameters = [{}];
            } else {
              schema[schema.length - 1].typeParameters?.push({});
            }
            getCurrentTypeParameter().name = path.node.name;
          }
          this.traverse(path);
        },
        visitIdentifier(path) {
          if (n.TSTypeAliasDeclaration.check(path.parent.node)) {
            getCurrentSchema().name = path.node.name;
          }
          //   if (n.TSPropertySignature.check(path.parent.node)) {
          //     getCurrentProperty().name = path.node.name;
          //     console.log(getCurrentProperty(), path.node.name);
          //   }
          this.traverse(path);
        },
        visitTSPropertySignature(path) {
          if (n.TSTypeLiteral.check(path.parent.node)) {
            if (!schema[schema.length - 1].properties?.length) {
              schema[schema.length - 1].properties = [{}];
            } else {
              schema[schema.length - 1].properties?.push({});
            }
            getCurrentProperty().optional = path.node.optional;
            if (n.Identifier.check(path.node.key)) {
              getCurrentProperty().name = path.node.key.name;
            }
          }
          this.traverse(path);
        },
        // 处理 any 类型
        visitTSAnyKeyword(path) {
          // 在泛型参数中出现
          if (n.TSTypeParameter.check(path.parent.node)) {
            getCurrentTypeParameter().default = "any";
          }
          this.traverse(path);
        },
      });
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
