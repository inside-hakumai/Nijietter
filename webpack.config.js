module.exports = {
   // メインとなるJavaScriptファイル（エントリーポイント）
   entry: {
      'active': './src/scripts/client-main-active.js',
      'inactive': './src/scripts/client-main-inactive.js'
   },
   // ファイルの出力設定
   output: {
      //  出力ファイルのディレクトリ名
      path: `${__dirname}/public/javascripts`,
      // 出力ファイル名
      filename: 'bundle-[name].js'
   },
   module : {
      // Loaderの設定
      rules : [
         // CSSファイルの読み込み
         {
            // 対象となるファイルの拡張子
            test: /\.css/,
            loaders: ['style-loader', 'css-loader']
         },
      ]
   }
};
