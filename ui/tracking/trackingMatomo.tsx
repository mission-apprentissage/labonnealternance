"use client"

import Script from "next/script"

import { publicConfig } from "@/config.public"
import { isWidget } from "@/utils/is-widget.utils"

export const Matomo = () => {
  if (!isWidget()) {
    // lazyOnload : le conteneur Matomo (~86 ko + plugin heatmap) sort du chemin
    // critique et ne charge qu'après `window.load` (un rebond avant `load` ne sera pas tracké).
    return (
      <Script id="matomo" strategy="lazyOnload">
        {`
      var _mtm = window._mtm = window._mtm || [];
      var _paq = window._paq = window._paq || [];
      _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
      _paq.push(['setConsentGiven']);
      _paq.push(['rememberConsentGiven']);
      _paq.push(['enableHeartBeatTimer']);
      _paq.push(['HeatmapSessionRecording::enable']);
      (function() {
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src='${publicConfig.matomo.url}/${publicConfig.matomo.jsTrackerFile}'; s.parentNode.insertBefore(g,s);
        })();
        `}
      </Script>
    )
  }
}
