
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = [{
  mode: 'development',
  entry: './dev/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'dev.bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './dev/index.html' })
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.(mjs|js|ts)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  externals: {
    fs: 'null',
    'node-fetch': 'fetch',
    'isomorphic-fetch': 'fetch',
    xmldom: 'window',
    'text-encoding': 'TextEncoder',
    'whatwg-url': 'window',
    '@trust/webcrypto': 'crypto'
  },
  devServer: {
    static: './dist'
  },
  devtool: 'source-map'
},
{
  mode: 'development',
  entry: {
    shortChatPane: './src/shortChatPane.js',
    longChatPane: './src/longChatPane.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  externals: {
    fs: 'null',
    'node-fetch': 'fetch',
    'isomorphic-fetch': 'fetch',
    xmldom: 'window',
    'text-encoding': 'TextEncoder',
    'whatwg-url': 'window',
    '@trust/webcrypto': 'crypto'
  },
  devtool: 'source-map'
}]
