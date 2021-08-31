import * as recast from "recast";
import { namedTypes as n, visit } from "ast-types";
import * as typescriptParse from "recast/parsers/typescript";
import * as ejs from "ejs";
import { getTemplate } from "./template";

let schema: {
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
    case "TSVoidKeyword":
      type = "void";
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
        case "TSVoidKeyword":
          type = "void";
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
  if (n.TSTypeReference.check(node)) {
    if (node.typeName.type === "Identifier") {
      property.type = node.typeName.name;
    } else if (node.typeName.type === "TSQualifiedName") {
      property.type = getTSQualifiedNameString(node.typeName);
    }
  } else if (n.TSTypeLiteral.check(node)) {
    property.type = property.name;
    formatTypeLiteral(node, property.name);
  } else if (n.TSFunctionType.check(node)) {
    property.type = property.name;
    formatFunctionType(node, property.name);
  } else if (n.TSUnionType.check(node)) {
    const properties: typeof property[] = [];
    node.types.map((s) => {
      const tempProperty: typeof property = { name: property.name };
      formateTypeAnnotation(s, tempProperty);
      properties.push(tempProperty);
      property.type = properties.map((s) => s.type).join("|");
    });
  } else if (n.TSLiteralType.check(node)) {
    property.type = formatLiteralType(node);
  } else {
    property.type = getType(node.type);
  }
};

const formatLiteralType = (node: any) => {
  let type = "";
  if (n.TSLiteralType.check(node)) {
    if (n.StringLiteral.check(node.literal)) {
      type = `"${node.literal.value}"`;
    } else if (n.NumericLiteral.check(node.literal)) {
      type = `${node.literal.value}`;
    } else if (n.BooleanLiteral.check(node.literal)) {
      type = `${node.literal.value}`;
    }
  }
  return type.toString();
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
          formateTypeAnnotation(s.typeAnnotation.typeAnnotation, property);
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

const formatInterfaceBody = (
  node: any,
  typeName?: string,
  typeParameters: typeof schema[0]["typeParameters"] = []
) => {
  if (n.TSInterfaceBody.check(node)) {
    const properties: typeof schema[0]["properties"] = [];
    node.body.map((s) => {
      if (n.TSPropertySignature.check(s)) {
        const property: typeof properties[0] = {
          optional: s.optional,
        };
        if (s.key.type === "Identifier") {
          property.name = s.key.name;
        }
        if (s.typeAnnotation?.type === "TSTypeAnnotation") {
          formateTypeAnnotation(s.typeAnnotation.typeAnnotation, property);
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
          formateTypeAnnotation(s.typeAnnotation?.typeAnnotation, property);
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
    const returnType: {
      name?: string;
      optional?: boolean;
      type?: string;
      comments?: string[];
    } = {
      name: typeName,
    };
    formateTypeAnnotation(node.typeAnnotation?.typeAnnotation, returnType);
    schema.push({
      name: typeName,
      type: "function",
      typeParameters: typeParameters,
      properties: properties,
      returnType: returnType.type,
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

const formatInterfaceDeclaration = (node: any) => {
  if (n.TSInterfaceDeclaration.check(node)) {
    const name = node.id.type === "Identifier" ? node.id.name : "";
    const typeParameters = formatTypeParameterDeclaration(node);
    formatInterfaceBody(node.body, name, typeParameters);
  }
};

const formatShema = (data: typeof schema) => {
  const formatedSchema: {
    name: string;
    properties: {
      name: string;
      description: string;
      type: string;
      required: boolean;
    }[];
  }[] = [];
  data.map((s) => {
    let name = s.name || "";
    if (s.typeParameters && s.typeParameters.length > 0) {
      const arr = s.typeParameters.map((s) => {
        if (s.default) {
          return `${s.name} = ${s.default}`;
        } else {
          return s.name;
        }
      });
      name = `${name}<${arr.join(", ")}>`;
    }
    if (s.type === "literal") {
      formatedSchema.push({
        name: name,
        properties:
          s.properties?.map((p) => {
            let description = "";
            if (p.comments?.length) {
              description = p.comments
                .map((c) => {
                  let comment = c;
                  const match = c.match(/(@description).*/);
                  if (match?.length) {
                    comment = match[0].replace("@description", "").trim();
                  }
                  return comment;
                })
                .join("，");
            }
            return {
              name: p.name!,
              description: description,
              type: `\`${p.type}\``,
              required: p.optional !== true,
            };
          }) || [],
      });
    } else if (s.type === "function") {
      name = `${name}`;
      let properties: typeof formatedSchema[0]["properties"] = [];
      if (s.properties && s.properties.length > 0) {
        properties = s.properties.map((p) => {
          let description = "";
          if (p.comments?.length) {
            description = p.comments
              .map((c) => {
                let comment = c;
                const match = c.match(/(@description).*/);
                if (match?.length) {
                  comment = match[0].replace("@description", "").trim();
                }
                return comment;
              })
              .join("，");
          }
          return {
            name: p.name!,
            description: description,
            type: `\`${p.type}\``,
            required: p.optional !== true,
          };
        });
      }
      formatedSchema.push({
        name: name,
        properties: [
          ...properties,
          {
            name: "`--`",
            description: "返回值",
            type: `\`${s.returnType}\`` || "",
            required: false,
          },
        ],
      });
    }
  });
  return formatedSchema;
};

export const compile = (code: string) => {
  schema = [];
  const ast = recast.parse(code, { parser: typescriptParse });
  visit(ast, {
    visitExportNamedDeclaration(path) {
      this.traverse(path);
    },
    visitTSTypeAliasDeclaration(path) {
      formatTypeAliasDeclaration(path.node);
      this.traverse(path);
    },
    visitTSInterfaceDeclaration(path) {
      formatInterfaceDeclaration(path.node);
      this.traverse(path);
    },
  });
  console.log(JSON.stringify(schema.reverse(), null, 4));
  const formatedSchema = formatShema(schema);
  const md = ejs.render(getTemplate(), { schema: formatedSchema });
  return {
    schema: formatedSchema,
    markdown: md,
  };
};
