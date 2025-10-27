import path from 'path'

const externalsBase = {
  fs: 'null',
  'node-fetch': 'fetch',
  'isomorphic-fetch': 'fetch',
  'text-encoding': 'TextEncoder',
  '@trust/webcrypto': 'crypto'
  // Removed @xmldom/xmldom and whatwg-url - use native browser APIs
}

export default [
  {
    mode: 'production',
    entry: './src/main.js',
    resolve: {
      extensions: ['.js', '.ts'],
      fallback: { path: false }
    },
    output: {
      path: path.resolve(process.cwd(), 'dist'),
      globalObject: 'this',
      iife: true,
      clean: false
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
      ...externalsBase
    },
    devtool: 'source-map'
  },
  {
    mode: 'production',
    entry: {
      shortChatPane: './src/shortChatPane.js',
      longChatPane: './src/longChatPane.js'
    },
    output: {
      path: path.resolve(process.cwd(), 'dist'),
      globalObject: 'this',
      iife: true,
      clean: false
    },
    resolve: {
      extensions: ['.js', '.ts'],
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
      ...externalsBase
    },
    devtool: 'source-map'
  }
]
