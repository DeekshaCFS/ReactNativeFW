const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    blockList: [
      /.*\\android\\app\\build\\.*/,
      /.*\\android\\build\\.*/,
      /.*\\ios\\build\\.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);