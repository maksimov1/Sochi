const path = require('path')
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
   entry: './src/assets/js/main.js',
   mode: 'production',
   output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'main.js'
   },
   plugins: [
      new CopyWebpackPlugin([
         { from: './src/index.html', to: "index.html" },
         { from: './src/elements.html', to: "elements.html" },
         { from: './src/generic.html', to: "generic.html" },
         { from: './src/landing.html', to: "landing.html" },
         { from: './src/images/', to: "images" },
         { from: './src/assets/css/', to: "assets/css" },
         { from: './src/assets/fonts/', to: "assets/fonts" },
      ]),
      new webpack.ProvidePlugin({
         '$': "jquery",
         'jQuery': "jquery",
         'window.jQuery': "jquery",
         'Web3': "web3",
      }),
   ],
   devtool: 'source-map',
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader',
            query: {
               presets: ['env'],
               plugins: ['transform-runtime']
            }
         },
         {
            test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
            use: [{
               loader: 'file-loader',
               options: {
                  name: '[name].[ext]',
                  outputPath: '.',    // where the fonts will go
                  publicPath: '../'       // override the default path
               }
            }]
         },
      ]
   }
}

