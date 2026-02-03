const { getDefaultConfig } = require('expo/metro-config');

// Fix for expo-sqlite on web: ensure Metro treats .wasm as an asset.
// Without this, bundling can fail with: unable to resolve module ./wa-sqlite/wa-sqlite.wasm
const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

module.exports = config;
