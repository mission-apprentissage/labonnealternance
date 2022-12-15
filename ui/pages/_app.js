import App from "next/app"
import React from "react"
import HeadLaBonneAlternance from "../components/head"

import Providers from "../context/Providers"

import "../public/styles/application.scss"

import PageTracker from "../components/pageTracker"
import { getEnvFromProps } from "../utils/env"
class LaBonneAlternance extends App {
  render() {
    const { Component, pageProps } = this.props

    const env = getEnvFromProps(this.props).env

    return (
      <Providers env={env}>
        <PageTracker>
          <main className="c-app">
            <HeadLaBonneAlternance />
            <Component {...pageProps} />
          </main>
        </PageTracker>
      </Providers>
    )
  }
}
export default LaBonneAlternance
