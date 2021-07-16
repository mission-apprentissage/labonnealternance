const withPlugins = require("next-compose-plugins");
const withImages = require("next-images");
const path = require("path");
const config = require("config");

/*
 * BEGIN OF SENTRY---------------------------
 */

// Use the hidden-source-map option when you don't want the source maps to be
// publicly available on the servers, only to the error reporting
const withSourceMaps = require("@zeit/next-source-maps")();

// Use the SentryWebpack plugin to upload the source maps during build step
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

const { uiSentryDsn, sentryOrg, sentryProject, sentryAuthToken } = config.private;

const env = config.env;

process.env.uiSentryDsn = uiSentryDsn;
process.env.sentryOrg = sentryOrg;
process.env.sentryProject = sentryProject;
process.env.sentryAuthToken = sentryProject;
process.env.env = env;
process.env.publicUrl = config.publicUrl;

/*
 * END OF SENTRY---------------------------
 */

module.exports = withPlugins(
  [
    [
      withImages,
      {
        /* plugin config here ... */
      },
    ],

    [
      withSourceMaps,
      {
        webpack: (config, options) => {
          config.module.rules.push({
            test: /\.(svg|png|jpg|gif)$/,
            use: {
              loader: "url-loader",
              options: {
                limit: 100000,
                name: "[name].[ext]",
              },
            },
          });
          // In `pages/_app.js`, Sentry is imported from @sentry/browser. While
          // @sentry/node will run in a Node.js environment. @sentry/node will use
          // Node.js-only APIs to catch even more unhandled exceptions.
          //
          // This works well when Next.js is SSRing your page on a server with
          // Node.js, but it is not what we want when your client-side bundle is being
          // executed by a browser.
          //
          // Luckily, Next.js will call this webpack function twice, once for the
          // server and once for the client. Read more:
          // https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
          //
          // So ask Webpack to replace @sentry/node imports with @sentry/browser when
          // building the browser's bundle
          if (!options.isServer) {
            config.resolve.alias["@sentry/node"] = "@sentry/browser";
          }

          // When all the Sentry configuration env variables are available/configured
          // The Sentry webpack plugin gets pushed to the webpack plugins to build
          // and upload the source maps to sentry.
          // This is an alternative to manually uploading the source maps
          // Note: This is disabled in development mode.
          if (
            uiSentryDsn &&
            sentryOrg &&
            sentryProject &&
            sentryAuthToken &&
            (env === "production" || env === "recette")
          ) {
            config.plugins.push(
              new SentryWebpackPlugin({
                include: ".next",
                ignore: ["node_modules"],
                urlPrefix: "~/_next",
              })
            );
          }

          return config;
        },
      },
    ], // end of withSourceMaps
  ],
  {
    /* global config here ... */
    sassOptions: {
      includePaths: [path.join(__dirname, "/public/styles")],
    },
  }
);
