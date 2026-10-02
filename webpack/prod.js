const path = require("path");

module.exports = {
  mode: "production",
  devtool: false,
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "bundle.min.js",
    publicPath: "",
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  plugins: [
    new (require("html-webpack-plugin"))({
      template: "./index.html",
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new (require("terser-webpack-plugin"))({
        extractComments: false,
        terserOptions: {
          format: { comments: false }
        }
      })
    ]
  },
  performance: {
    maxEntrypointSize: 1500000,
    maxAssetSize: 1500000
  }
};
