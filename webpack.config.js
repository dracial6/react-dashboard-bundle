const path = require("path");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './dist/index.js',
  output: {
    filename: 'dashboard.js',
    libraryTarget: 'umd',
    library: "dashboard", // 외부에서 접근할 때 사용될 라이브러리 이름
    path: path.resolve(__dirname, "./bundle"),
    assetModuleFilename: 'resources/[name][ext]',
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        type: "asset/resource"
      },
      {
        test: /\.(jsx|js)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: [".jsx", ".js"], // 빌드 대상이 될 파일 타입 지정
  },
  optimization: {
    minimize: true, // 최적화 사용 여부
  },
  plugins: [
    new MiniCssExtractPlugin()
  ]
};