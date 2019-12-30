const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 載入用來 獨立 css 檔案的套件
const CopyPlugin = require('copy-webpack-plugin'); // 載入 搬運 plugins
const webpack = require('webpack'); // 載入 webpack 已使用 webpack 的方法 如 webpack.ProvidePlugin
const HtmlWebpackPlugin = require('html-webpack-plugin') // 使用 html-webpack-plugin 來管理多個 HTML 或 在使用框架時建立1個模板來統一管理每個 COMPONENT 相同的部分
const VueLoaderPlugin = require('vue-loader/lib/plugin') // 官方 loader-plugin 推薦套件

module.exports = {
  context: path.resolve(__dirname, './src'), // cotext => 用來設定 entry 的資料夾是哪個資料夾
  mode: process.env.NODE_ENV,
  entry: { // 當要有多個進入點時可以使用物件寫法 ，而 output 的 filename 可以用 [name].js 設定，name 抓取自 entry 的 key 值 ，注意是 key 不是 value 所以才要加 .js
    index: 'index', // 使用 resolve 省略路徑和副檔名後的 entry 設定
  },
  output: { // 輸出相關設定
    path: path.resolve(__dirname, 'dist'), // 編譯後輸出的檔案目錄資料夾，一樣用 dirname 來避免路徑寫死
    // filename: 'index.bundle.js', // 編譯後輸出的檔案名稱
    filename: './js/[name].js?[hash:8]', // 使用 [name] 自動生成多個 entry 打包後的對應檔案 ，[hash:8] 使我們每次deploy 了一版新的 code時都會產生1個新的亂數變更快取，使瀏覽器在請求快取時因 [hash:8] 改變快取的關係，而正確的去重新讀取新版的 code 而不是舊的快取所儲存的 舊 code
  },
  optimization: { // 將使用的 node_module 套件用 vender.js 分開打包
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: 'vendor',
          chunks: 'initial',
          enforce: true,
        },
      },
    },
  },
  devServer: { // 配合 webpack-dev-server 所做的設定
    compress: true, // 是否經過壓縮
    port: 3000,
  },
  resolve: { // 設定定 resovle 的 modules   extentions 省略路徑與 附檔名
    modules: [
      path.resolve('src'),
      path.resolve('src/js'),
      path.resolve('src/js/modules'),
      path.resolve('src/css'),
      path.resolve('src/scss'),
      path.resolve('src/images'),
      path.resolve('src/assets'),
      path.resolve('node_modules'), // 注意 node_modules 原本是 resolve 預設值 ，但如果要設定 resolve 就代表重新設定所以 node_modules 一定也要設定好
    ],
    extensions: ['.js'], // 建議不要設定多個附檔名否則容易衝突
  },
  module: {
    rules: [
      {
        test:/\.vue$/,
        use: 'vue-loader',
      },
      { // babel-loader
        test: /\.js$/,
        use: 'babel-loader',
        include: path.resolve('src/js'), // 加入 include 和 exclude 來 指定 loader 搜尋的目標 ，和排除搜尋的目標 以增加打包效率
        exclude: path.resolve('node_modules'),
      },
      { // css-loader ，必須搭配 style-loder 來做使用，但官方並沒有針對此做說明，所以要記得安裝  style-loader
        test: /\.css$/i, // 寫入一段表達式用來設定 loader 要處理的檔案的副檔名。
        // use: ['style-loader', 'css-loader'], // 使用 use 設定處理的檔案依序執行的 loader ，並且執行順序由陣列最後 css-loader 面往前執行到 style-loader
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'], // 使用 MiniCssExtractPlugin 使的 use 設定
        include: path.resolve('src/css'),
        exclude: path.resolve('node_modules'),
      },
      // { //  如果要使用 HtmlWebpackPlugin 管理每個 html 時就不用此 loader 來搬運 html 的位置
      //   test: /\.html$/,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       options: {
      //         name: '[path][name].[ext]', // 設定搬運的 html 路徑 [path] 就是 output 的 path 路徑、[name] 為原本名稱、[ext] 為原本附檔名
      //       }
      //     }
      //   ],
      // },
      {
        test: /\.(sa|sc|c)ss$/,
        // use:[MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
        use:['vue-style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      { // 先用image-webpack-loader 壓縮圖片再用 url-loader 轉換圖片到 64base 格式
        test: /\.(png|jpg|gif)$/i,
        include: path.resolve('src/images'),
        exclude: path.resolve('node_modules'),
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192, // 表示當圖片大小超過 8192kb 就不把圖片轉成 64base
              name: '[path][name].[ext]?[hash:8]' // hash 自動變更快取亂數
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75
              }
            },
          }
        ],
      },
      { // 搬運使用的字型檔
        test: /\.(ttf|woff|woff2|eot)$/,
        use: {
          loader: 'file-loader',
          options: {
            name:'[path][name].[ext]?[hash:8]',
          }
        },
        include: path.resolve('src/assets'),
        exclude: path.resolve('node_modules'),
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({ // MiniCssExtractPlugin 插件設定使我們注入到 js 的 css 檔可以獨立出來
      filename: './css/[name].css',
    }),
    new CopyPlugin([
      { from: 'assets', to: 'assets' }, // from 來源位置 to 輸出位置
    ]),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new HtmlWebpackPlugin({
      title: 'Vue', // html title
      filename: 'index.html', // 輸出後檔名
      template: 'html/index.html', // 使用的模板內容
      viewport: 'width=device-width, initial-scale=1.0', // 網頁的 view-port content 設定
      chunks: ['vendor','index'] // 對應讀取的 js 檔案，這裡取的是 entry 的 key 值，會在模板中生成 script 載入 此 js
    }),
  ],

};
