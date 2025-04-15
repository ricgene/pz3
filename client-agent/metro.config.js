const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add additional asset extensions if needed
config.resolver.assetExts.push('wasm');

module.exports = config;