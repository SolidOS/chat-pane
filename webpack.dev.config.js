import HtmlWebpackPlugin from 'html-webpack-plugin'
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin'

export default [
  {
    mode: 'development',
    entry: ['./dev/index.js'],
    plugins: [
      new HtmlWebpackPlugin({ template: './dev/index.html' }),
      new NodePolyfillPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts']
    },

    devServer: {
      static: './dev'
    },
    devtool: 'source-map',
  }
]
