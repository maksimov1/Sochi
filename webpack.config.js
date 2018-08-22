const path = require('path')
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
   entry: './app/assets/js/main.js',
   mode: 'production',
   output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'main.js'
   },
   plugins: [
      new CleanWebpackPlugin(['build']),
      new CopyWebpackPlugin([
         { from: './app/index.html', to: "index.html" },
         { from: './app/elements.html', to: "elements.html" },
         { from: './app/generic.html', to: "generic.html" },
         { from: './app/landing.html', to: "landing.html" },
         { from: './app/images/', to: "images" },
      ]),
      new webpack.ProvidePlugin({
         '$': "jquery",
         'jQuery': "jquery",
         'window.jQuery': "jquery"
      })
   ],
   devtool: 'source-map',
   module: {
      rules: [
         { test: /\.s?css$/, use: [ 'style-loader', 'css-loader', 'sass-loader' ] },
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

