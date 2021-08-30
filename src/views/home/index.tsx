import LayoutComponent from "@/layout/default";
import styles from "./index.less";
import * as recast from "recast";
4;
import { namedTypes as n, visit } from "ast-types";
import * as typescriptParse from "recast/parsers/typescript";
import { onMounted, defineComponent } from "vue";

const code = `
type b<T = any> = {
	a: (n:string,b?:(t:string)=>void) => void;
	// dsd
	coverRight?: ffff;
	/*
		dsdsd
		*/
	children?: React.ReactNode.a.b;
	// dsdsd
	//ewewe
	contentPadding?: {
	  /**
	   * erererr
	   *
	   * @type {string}
	   */
	  b: {
		/**
		 *hghgh
		 *
		 * @type {string}
		 */
		c: string;
	  };
	};
  };
`;

export default defineComponent({
  setup() {
    onMounted(() => {
      const schema: {
        name?: string;
        type: "function" | "literal";
        typeParameters?: { name: string; default?: string }[];
        properties?: {
          name?: string;
          optional?: boolean;
          type?: string;
          comments?: string[];
        }[];
        returnType?: string;
      }[] = [];

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

      const formatTypeParameterDeclaration = (node: any) => {
        const typeParameters: typeof schema[0]["typeParameters"] = [];
        if (n.TSTypeAliasDeclaration.check(node) && node.typeParameters) {
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
        return typeParameters;
      };

      const formateTypeAnnotation = (
        node: any,
        property: {
          name?: string;
          optional?: boolean;
          type?: string;
          comments?: string[];
        }
      ) => {
        if (n.TSTypeAnnotation.check(node)) {
          if (node.typeAnnotation.type === "TSTypeReference") {
            if (node.typeAnnotation.typeName.type === "Identifier") {
              property.type = node.typeAnnotation.typeName.name;
            } else if (
              node.typeAnnotation.typeName.type === "TSQualifiedName"
            ) {
              property.type = getTSQualifiedNameString(
                node.typeAnnotation.typeName
              );
            }
          } else if (node.typeAnnotation.type === "TSTypeLiteral") {
            property.type = property.name;
            formatTypeLiteral(node.typeAnnotation, property.name);
          } else if (node.typeAnnotation.type === "TSFunctionType") {
            property.type = property.name;
            formatFunctionType(node.typeAnnotation, property.name);
          } else {
            property.type = getType(node.typeAnnotation.type);
          }
        }
      };

      const formatTypeLiteral = (
        node: any,
        typeName?: string,
        typeParameters: typeof schema[0]["typeParameters"] = []
      ) => {
        if (n.TSTypeLiteral.check(node)) {
          const properties: typeof schema[0]["properties"] = [];
          node.members.map((s) => {
            if (s.type === "TSPropertySignature") {
              const property: typeof properties[0] = {
                optional: s.optional,
              };
              if (s.key.type === "Identifier") {
                property.name = s.key.name;
              }
              if (s.typeAnnotation?.type === "TSTypeAnnotation") {
                formateTypeAnnotation(s.typeAnnotation, property);
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
          schema.push({
            name: typeName,
            type: "literal",
            typeParameters: typeParameters,
            properties: properties,
          });
        }
      };

      const formatFunctionType = (
        node: any,
        typeName?: string,
        typeParameters: typeof schema[0]["typeParameters"] = []
      ) => {
        if (n.TSFunctionType.check(node)) {
          const properties: typeof schema[0]["properties"] = [];
          if (node.parameters.length > 0) {
            node.parameters.map((s) => {
              if (n.Identifier.check(s)) {
                const property: typeof properties[0] = {
                  optional: s.optional,
                  name: s.name,
                };
                formateTypeAnnotation(s.typeAnnotation, property);
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
            name: typeName,
            type: "function",
            typeParameters: typeParameters,
            properties: properties,
          });
        }
      };

      const formatTypeAliasDeclaration = (node: any) => {
        if (n.TSTypeAliasDeclaration.check(node)) {
          const name = node.id.name;
          const typeParameters = formatTypeParameterDeclaration(node);
          if (node.typeAnnotation.type === "TSTypeLiteral") {
            formatTypeLiteral(node.typeAnnotation, name, typeParameters);
          } else if (node.typeAnnotation.type === "TSFunctionType") {
            formatFunctionType(node.typeAnnotation, name, typeParameters);
          }
        }
      };

      const ast = recast.parse(code, { parser: typescriptParse });
      visit(ast, {
        visitExportNamedDeclaration(path) {
          console.log(path.node);
        },
        // 处理 type 声明的类型
        visitTSTypeAliasDeclaration(path) {
          formatTypeAliasDeclaration(path.node);
          console.log(JSON.stringify(schema.reverse(), null, 4));
          this.traverse(path);
        },
      });
    });

    return () => (
      <div class={styles.home}>
        <LayoutComponent name="121212">
          <div class={styles.container}>{code}</div>
        </LayoutComponent>
      </div>
    );
  },
});
