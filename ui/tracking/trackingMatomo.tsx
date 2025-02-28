import Script from "next/script"

import { publicConfig } from "@/config.public"

export const Matomo = () => {
  return (
    <Script id="matomo" strategy="afterInteractive">
      {`
      var _paq = window._paq = window._paq || [];
      /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
      var u="//${publicConfig.matomo.url}/";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '${publicConfig.matomo.siteId}']);
      _paq.push(['setConsentGiven']);
      _paq.push(['rememberCookieConsentGiven']);
      _paq.push(['HeatmapSessionRecording::enable']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
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
