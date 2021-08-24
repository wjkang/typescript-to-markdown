module.exports = {
  css: {
    requireModuleExtension: false,
    loaderOptions: {
      css: {
        modules: {
          localIdentName: "[local]_[hash:base64:5]",
        },
        localsConvention: "camelCaseOnly",
      },
    },
  },
  productionSourceMap: false,
};
