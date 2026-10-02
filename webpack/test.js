const path = require("path");

// Bundles the headless logic test-suite (tests/testEntry.js) so the real game
// modules (Chem, Levels, Utilities) can be executed inside a browser context.
module.exports = {
  mode: "development",
  devtool: false,
  entry: "./tests/testEntry.js",
  output: {
    path: path.resolve(__dirname, "../dist-test"),
    filename: "test-bundle.js"
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
  performance: {
    hints: false
  }
};
