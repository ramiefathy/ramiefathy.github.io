const path = require('path');

module.exports = {
  entry: {
    app: './apps/dermatology-study-system/js/app.js',
    quiz: './apps/dermatology-study-system/js/quiz.js',
    auth: './apps/dermatology-study-system/js/auth.js',
    profile: './apps/dermatology-study-system/js/profile-manager.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/dist/'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/dermatology-study-system/js'),
      '@components': path.resolve(__dirname, 'apps/dermatology-study-system/components'),
      '@config': path.resolve(__dirname, 'apps/dermatology-study-system/config')
    },
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true
  }
}; 