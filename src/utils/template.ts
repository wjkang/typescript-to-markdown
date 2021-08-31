let template = `
<% schema.map(item => { %>
### <%- item.name %>

|参数|说明|类型|必须|
|--|--|--|--|
<% item.properties.map(property => { _%>
|<%= property.name %>|<%= property.description %>|<%- property.type.replace("|","\\\\|") %>|<%= property.required?"是":"否" %>|
<% }) _%>
<% }) _%>
`;

export const getTemplate = () => {
  return localStorage.getItem("ts_to_md_template") || template;
};

export const setTemplate = (str: string) => {
  template = str;
  localStorage.setItem("ts_to_md_template", str);
};
