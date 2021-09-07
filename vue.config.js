module.exports = {
  outputDir: "docs",
  publicPath: process.env.page ? "/typescript-to-markdown/" : "/",
  css: {
    extract: false,
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
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
  },
  productionSourceMap: false,
};
