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
		a:()=>void
		// dsd
		coverRight?: ffff;
		/*
		dsdsd
		*/
		children?: React.ReactNode.a.b
		// dsdsd
		//ewewe
		contentPadding?: {a:string};
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

      const getType = (tsType?: string) => {
        let type = "";
        switch (tsType) {
          case "TSAnyKeyword":
            type = "any";
            break;
          case "TSNumberKeyword":
            type = "number";
            break;
          case "TSStringKeyword":
            type = "string";
            break;
          case "TSUnknownKeyword":
            type = "any";
            break;
          case "TSBooleanKeyword":
            type = "boolean";
            break;
          default:
            break;
        }
        return type;
      };

      const getTSQualifiedNameString = (typeName: any) => {
        let name: string[] = [];
        if (n.TSQualifiedName.check(typeName)) {
          if (typeName.right.type === "Identifier") {
            name.push(typeName.right.name);
          }
          if (typeName.left.type === "Identifier") {
            name.push(typeName.left.name);
          }
          if (typeName.left.type === "TSQualifiedName") {
            name = name.concat(getTSQualifiedNameString(typeName.left));
          }
        }
        return name.reverse().join(".");
      };

      const formatAst = (node: any) => {
        if (n.TSTypeAliasDeclaration.check(node)) {
          const name = node.id.name;
          const typeParameters: typeof schema[0]["typeParameters"] = [];
          const properties: typeof schema[0]["properties"] = [];
          if (node.typeParameters) {
            node.typeParameters.params.map((s) => {
              let type = "";
              switch (s.default?.type) {
                case "TSAnyKeyword":
                  type = "any";
                  break;
                case "TSNumberKeyword":
                  type = "number";
                  break;
                case "TSStringKeyword":
                  type = "string";
                  break;
                case "TSUnknownKeyword":
                  type = "any";
                  break;
                case "TSBooleanKeyword":
                  type = "boolean";
                  break;
                default:
                  break;
              }
              typeParameters.push({
                name: s.name,
                default: type,
              });
            });
          }
          if (node.typeAnnotation.type === "TSTypeLiteral") {
            node.typeAnnotation.members.map((s) => {
              if (s.type === "TSPropertySignature") {
                const property: typeof properties[0] = {
                  optional: s.optional,
                };
                if (s.key.type === "Identifier") {
                  property.name = s.key.name;
                }
                if (s.typeAnnotation?.type === "TSTypeAnnotation") {
                  if (
                    s.typeAnnotation.typeAnnotation.type === "TSTypeReference"
                  ) {
                    if (
                      s.typeAnnotation.typeAnnotation.typeName.type ===
                      "Identifier"
                    ) {
                      property.type =
                        s.typeAnnotation.typeAnnotation.typeName.name;
                    } else if (
                      s.typeAnnotation.typeAnnotation.typeName.type ===
                      "TSQualifiedName"
                    ) {
                      property.type = getTSQualifiedNameString(
                        s.typeAnnotation.typeAnnotation.typeName
                      );
                    }
                  } else {
                    property.type = getType(
                      s.typeAnnotation.typeAnnotation.type
                    );
                  }
                }
                if (s.comments) {
                  const comments: string[] = [];
                  s.comments.map((c) => {
                    if (c.leading) {
                      comments.push(c.value);
                    }
                  });
                  property.comments = comments;
                }
                properties.push(property);
              }
            });
          }
          schema.push({
            name: name,
            typeParameters: typeParameters,
            properties: properties,
          });
        }
        return;
      };

      const ast = recast.parse(code, { parser: typescriptParse });
      visit(ast, {
        visitExportNamedDeclaration(path) {
          console.log(path.node);
        },
        // 处理 type 声明的类型
        visitTSTypeAliasDeclaration(path) {
          formatAst(path.node);
          console.log(JSON.stringify(schema, null, 4));
          this.traverse(path);
        },
        // visitTSTypeLiteral(path) {
        //   if (!isTopListeral(path)) {
        //     schema.push({
        //       name: getCurrentProperty().name,
        //     });
        //   }
        //   this.traverse(path);
        // },
        // // 处理泛型参数
        // visitTSTypeParameter(path) {
        //   if (n.TSTypeParameterDeclaration.check(path.parent.node)) {
        //     if (!schema[schema.length - 1].typeParameters?.length) {
        //       schema[schema.length - 1].typeParameters = [{}];
        //     } else {
        //       schema[schema.length - 1].typeParameters?.push({});
        //     }
        //     getCurrentTypeParameter().name = path.node.name;
        //   }
        //   this.traverse(path);
        // },
        // visitIdentifier(path) {
        //   if (n.TSTypeAliasDeclaration.check(path.parent.node)) {
        //     getCurrentSchema().name = path.node.name;
        //   }
        //   //   if (n.TSPropertySignature.check(path.parent.node)) {
        //   //     getCurrentProperty().name = path.node.name;
        //   //     console.log(getCurrentProperty(), path.node.name);
        //   //   }
        //   this.traverse(path);
        // },
        // visitTSPropertySignature(path) {
        //   if (n.TSTypeLiteral.check(path.parent.node)) {
        //     if (!schema[schema.length - 1].properties?.length) {
        //       schema[schema.length - 1].properties = [{}];
        //     } else {
        //       schema[schema.length - 1].properties?.push({});
        //     }
        //     getCurrentProperty().optional = path.node.optional;
        //     if (n.Identifier.check(path.node.key)) {
        //       getCurrentProperty().name = path.node.key.name;
        //     }
        //   }
        //   this.traverse(path);
        // },
        // // 处理 any 类型
        // visitTSAnyKeyword(path) {
        //   // 在泛型参数中出现
        //   if (n.TSTypeParameter.check(path.parent.node)) {
        //     getCurrentTypeParameter().default = "any";
        //   }
        //   this.traverse(path);
        // },
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
