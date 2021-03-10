import WebpackConfig from 'webpack-config';
import PATHS from '../paths';

export const isDevelopmentMode = () => (process.env.NODE_ENV !== 'production');
export const isSSR = () => (!!process.env.SSR);
export const hostDevServer = () => (!!process.env.DEV_SERVER);

// Export a new 'base' config, which we can extend/merge from
export default new WebpackConfig()
  .merge({
    context: __dirname,
    devServer: {
      historyApiFallback: true,
      watchOptions: {
        poll: 1000,
        ignored: ['node_modules'],
      },
    },
    mode: process.env.NODE_ENV,
    watch: hostDevServer(), // Only needed when we're also in host dev server mode
    resolve: {
      extensions: ['.js', '.jsx'],

      // When we do an `import x from 'x'`, webpack will first look in our
      // root folder to try to resolve the package this.  This allows us to
      // short-hand imports without knowing the full/relative path.  If it
      // doesn't find anything, then it'll check `node_modules` as normal
      modules: [
        PATHS.src,
        PATHS.root,
        'node_modules',
      ],
    },
    plugins: [],
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                // Ignore the .babelrc at the root of our project-- that's only
                // used to compile our webpack settings, NOT for bundling
                babelrc: false,
                presets: [
                  ['@babel/preset-env', {
                    // Enable tree-shaking by disabling commonJS transformation
                    modules: false,
                    // Exclude default regenerator-- we want to enable async/await
                    // so we'll do that with a dedicated plugin
                    exclude: ['transform-regenerator'],
                  }],
                  // Transpile JSX code
                  '@babel/preset-react',
                ],
                plugins: [
                  // 'transform-object-rest-spread',
                  '@babel/plugin-syntax-dynamic-import',
                  '@babel/plugin-transform-regenerator',
                  '@babel/plugin-proposal-class-properties',
                  ['@babel/plugin-proposal-decorators', { legacy: true }],
                ],
              },
            },
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          loader: 'file-loader',
          options: {
            name: isDevelopmentMode() ? 'images/[name].[ext]' : 'images/[name].[hash].[ext]',
            useRelativePath: !isSSR(),
          },
        },
        {
          test: /\.(woff|woff2|(o|t)tf|eot)$/i,
          loader: 'file-loader',
          options: {
            name: isDevelopmentMode() ? 'fonts/[name].[ext]' : 'fonts/[name].[hash].[ext]',
            // useRelativePath: !isSSR()
          },
        },

      ],
    },
  });
