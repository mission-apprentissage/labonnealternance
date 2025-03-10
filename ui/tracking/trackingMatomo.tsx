import Script from "next/script"

import { publicConfig } from "@/config.public"

export const Matomo = () => {
  return (
    <Script id="matomo" strategy="afterInteractive">
      {`
      var _mtm = window._mtm = window._mtm || [];
      _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
      (function() {
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src='${publicConfig.matomo.url}/${publicConfig.matomo.jsTrackerFile}'; s.parentNode.insertBefore(g,s);
      })();
      `}
    </Script>
  )
}

// keep it until heatmaps are up and running with the code above
/*
const initMatomo = () => {
  if (!isWidget()) {
    init(publicConfig.matomo)
    // @ts-expect-error
    const paq = window._paq
    paq.push(["setConsentGiven"])
    paq.push(["rememberConsentGiven"])
    paq.push(["HeatmapSessionRecording::enable"])
  }
}
*/
