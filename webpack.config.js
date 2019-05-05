let path = require('path');
let webpack = require('webpack');

module.exports = {
  entry: {
    'gw2-api': './src/index.ts',
    'gw2-api.min': './src/index.ts'
  },
  output: {
    path: path.resolve(__dirname, '_bundles'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'GW2API',
    umdNamedDefine: true
  },
  externals: {
    "request": "request"
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: [/node_modules/, /src\/test\/.*/]
    }]
  }
}