const HtmlWebpackPlugin = require('html-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = [{
  mode: 'development',
  entry: './dev/index.js',
  plugins: [
    new HtmlWebpackPlugin({ template: './dev/index.html' }),
    new NodePolyfillPlugin()
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts'],
    fallback: { path: false }
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
  resolve: {
    fallback: { path: false }
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
