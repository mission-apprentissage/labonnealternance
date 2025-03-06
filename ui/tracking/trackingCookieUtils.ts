import { NextRouter } from "next/router"

const COOKIE_REMOVE_TIME = -36 * 60 * 60 * 1000
export const MTM_CONSENT_COOKIE_DURATION = 30 * 365 * 24 * 60 * 60 * 1000

export const CONSENT_REMOVED_COOKIE_NAME = "mtm_consent_removed"
export const CONSENT_COOKIE_NAME = "mtm_consent"

export const getCookie = (cookieName) => {
  const cookiePattern = new RegExp("(^|;)[ ]*" + cookieName + "=([^;]*)"),
    cookieMatch = cookiePattern.exec(document.cookie)
  return cookieMatch ? window.decodeURIComponent(cookieMatch[2]) : null
}
export const setCookie = (cookieName: string, value: string, msToExpire?: number) => {
  const expiryDate = new Date()
  expiryDate.setTime(new Date().getTime() + msToExpire)
  document.cookie = cookieName + "=" + window.encodeURIComponent(value) + (msToExpire ? ";expires=" + expiryDate.toString() : "") + ";path=/;domain=;SameSite=None; Secure"
}
export const removeCookie = (cookieName) => {
  setCookie(cookieName, "", COOKIE_REMOVE_TIME)
}
export const setIsTrackingEnabled = () => {
  if (isConsentRemoved()) {
    optUserOut()
  } else {
    setReferer()
  }
}

export const optUserOut = () => {
  // @ts-expect-error
  window?._paq?.push(["optUserOut"])
}

export const forgetOptUserOut = () => {
  // @ts-expect-error
  window?._paq?.push(["forgetUserOptOut"])
}

const isConsentRemoved = () => {
  return getCookie(CONSENT_REMOVED_COOKIE_NAME) ? true : false
}

export const setReferer = () => {
  if (document.referrer) {
    setCookie("referer", document.referrer)
  }
}
export const setTrackingCookies = (router: NextRouter) => {
  if (!isConsentRemoved()) {
    const { query } = router
    const mtm_campaign = query?.mtm_campaign as string
    const utm_campaign = mtm_campaign || (query?.utm_campaign as string)
    if (utm_campaign) {
      setCookie("utm_campaign", utm_campaign)
    }
    if (query?.utm_source) {
      setCookie("utm_source", query.utm_source as string)
    }
    if (query?.utm_medium) {
      setCookie("utm_medium", query.utm_medium as string)
    }
  }
}
