import App from "next/app";
import React from "react";
import { ConnectedRouter } from "connected-next-router";
import { wrapper } from "store/configure-store";
import HeadLaBonneAlternance from "components/head";

import "public/styles/application.scss";

import * as Sentry from "@sentry/node";
import * as SentryReact from "@sentry/react";

if (process.env.uiSentryDsn) {
  Sentry.init({ dsn: process.env.uiSentryDsn, enabled: true, environment: process.env.env });
  SentryReact.init({ dsn: process.env.uiSentryDsn, enabled: true, environment: process.env.env });
}

class ExampleApp extends App {
  static async getInitialProps(context) {
    // récupération du hostname pour initialiser les fonts en preload
    const { req } = context.ctx;
    let host = "";
    if (req?.headers?.host) {
      host = req.headers.host;
      host = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
    }
    return { host };
  }

  render() {
    const { Component, pageProps, host } = this.props;

    return (
      <>
        <main className="c-app">
          <HeadLaBonneAlternance publicUrl={host && process.env.publicUrl ? host : ""} />
          <ConnectedRouter>
            <Component {...pageProps} />
          </ConnectedRouter>
        </main>
      </>
    );
  }
}

export default wrapper.withRedux(ExampleApp);
