const path = require('path')
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');

module.exports = {
   entry: './src/assets/js/main.js',
   mode: 'production',
   output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'main.js'
   },
   plugins: [
      new CleanWebpackPlugin(['build'], {exclude:['images', 'contracts']}),
      new CopyWebpackPlugin([
         { from: './src/index.html', to: "index.html" },
         { from: './src/elements.html', to: "elements.html" },
         { from: './src/generic.html', to: "generic.html" },
         { from: './src/landing.html', to: "landing.html" },
         { from: './src/images/', to: "images" },
      ]),
      new ImageminPlugin({
         test: 'images/*',
         cacheFolder: path.resolve(__dirname, 'cache/images'),
         plugins: [
            imageminMozjpeg({
               quality: 20,
               progressive: true
            })
         ]
      }),
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

