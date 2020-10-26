
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = [{
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'chat.bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' })
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
    contentBase: './dist'
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
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify')
    }
  },
  devtool: 'source-map'
}]
