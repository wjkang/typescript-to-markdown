module.exports = {
  css: {
    requireModuleExtension: false,
    loaderOptions: {
      css: {
        modules: {
          localIdentName: "[local]_[hash:base64:5]",
          auto: (resourcePath) => resourcePath.endsWith(".less"),
        },
        localsConvention: "camelCaseOnly",
      },
    },
  },
  productionSourceMap: false,
};
