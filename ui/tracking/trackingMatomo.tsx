"use client"

import Script from "next/script"

import { publicConfig } from "@/config.public"
import { isWidget } from "@/utils/isWidget.utils"

export const Matomo = () => {
  if (!isWidget()) {
    return (
      <Script id="matomo" strategy="afterInteractive">
        {`
      var _mtm = window._mtm = window._mtm || [];
      _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
      _mtm.push(['setConsentGiven'])
      _mtm.push(['rememberConsentGiven'])
      (function() {
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src='${publicConfig.matomo.url}/${publicConfig.matomo.jsTrackerFile}'; s.parentNode.insertBefore(g,s);
        })();
        `}
      </Script>
    )
  }
}
