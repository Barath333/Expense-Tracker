module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: false }],
    'react-native-reanimated/plugin',
    // Add this for .env support
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: true,
      allowUndefined: false,
    }],
  ],
};