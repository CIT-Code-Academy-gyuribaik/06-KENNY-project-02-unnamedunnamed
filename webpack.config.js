const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@core': path.resolve(__dirname, 'src/core/'),
      '@modes': path.resolve(__dirname, 'src/modes/'),
      '@entities': path.resolve(__dirname, 'src/entities/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
    },
  },
  devServer: {
    static: './dist',
    port: 8080,
    hot: true,
  },
  devtool: 'source-map',
};
