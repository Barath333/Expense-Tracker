// module.exports = {
//   presets: ['module:@react-native/babel-preset'],
//    plugins: [
//     '@babel/plugin-proposal-decorators',  // Required for Reanimated
//     'react-native-reanimated/plugin',
//     'react-native-worklets-core/plugin',   // Required for Vision Camera V5
//   ],
// };

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: false }],
    'react-native-reanimated/plugin',
  ],
};