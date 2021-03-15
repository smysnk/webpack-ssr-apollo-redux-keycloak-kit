import path from 'path';
import webpack from 'webpack';
import WebpackConfig from 'webpack-config';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

import PATHS from '../../paths';
import { isSSR, isDevelopmentMode } from './base';

const plugins = [
  // Overriden by server state in SSR mode
  new webpack.DefinePlugin({
    SERVER: false,
    VERSION: '"development"',
    SHA: '"development"',
    FRONTEND_URL: `"${ process.env.FRONTEND_URL }"`,
    API_ENDPOINT: `"${ process.env.API_ENDPOINT }"`,
    API_SECURE: process.env.API_SECURE === 'true',
    KEYCLOAK_REALM_NAME: `"${ process.env.KEYCLOAK_REALM_NAME }"`,
    KEYCLOAK_AUTH_SERVER_URL: `"${ process.env.KEYCLOAK_AUTH_SERVER_URL }"`,
    KEYCLOAK_CLIENT_ID: `"${ process.env.KEYCLOAK_CLIENT_ID }"`,
    KEYCLOAK_ON_LOAD: `"${ process.env.KEYCLOAK_ON_LOAD }"`,
  }),
];

const entry = {
  browser: [
    path.join(PATHS.entry, 'browser.js'),
  ],
};

if (!isDevelopmentMode()) {
  plugins.push(new CompressionPlugin());
}

if (isSSR()) {
  plugins.push(new WebpackManifestPlugin());
  plugins.push(new CopyWebpackPlugin({
    patterns: [
      { from: 'static' },
    ],
  }));
} else {
  const extractHTML = new HtmlWebpackPlugin({
    filename: 'index.html',
    inject: true,
    template: path.join(PATHS.src, 'index.html'),
    environment: process.env.NODE_ENV,
    imgPath: 'assets', // : 'src/assets'
  });
  plugins.push(extractHTML);
}

export default new WebpackConfig()
  .extend('[root]/base.js')
  .merge({
    entry,
    target: 'web',
    devServer: {
      contentBase: [path.join(__dirname, '../../static')],
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            // cacheGroupKey here is `commons` as the key of the cacheGroup
            name(module, chunks, cacheGroupKey) {
              return `${ cacheGroupKey }`;
            },
            chunks: 'all',
          },
        },
      },
    },
    devtool: isDevelopmentMode() ? 'source-map' : 'hidden-source-map',
    // Modules specific to our browser bundle
    module: {
      rules: [
      ],
    },
    output: {
      path: PATHS.public,
      publicPath: '/',
      // filename: '[name].js',
      filename: isDevelopmentMode() ? 'js/[name].js' : 'js/[name].[contenthash].js',
    },
    plugins,
  });
