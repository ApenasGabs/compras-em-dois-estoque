const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.transformer = {
    ...config.transformer,
    unstable_allowRequireContext: true,
};

config.resolver = {
    ...config.resolver,
    unstable_enablePackageExports: false,
};

module.exports = withNativeWind(config, { input: "./global.css" });