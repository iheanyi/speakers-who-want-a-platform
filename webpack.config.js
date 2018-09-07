var webpack = require("webpack");
var path = require("path");

module.exports = {
  module: {
    loaders: [
      {
        test: /\.((png)|(eot)|(woff)|(woff2)|(ttf)|(svg)|(gif))(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file?name=/[hash].[ext]"
      },
      { test: /\.css$/, loader: 'style!css' },
      {
        loader: "babel-loader",
        test: /\.js?$/,
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
    })
  ],

  context: path.join(__dirname, "src"),
  entry: {
    app: ["./js/app"]
  },
  output: {
    path: path.join(__dirname, "themes", "SpeakerList", "static", "js"),
    publicPath: "/",
    filename: "[name].js"
  },
  externals:  [/^vendor\/.+\.js$/]
};
