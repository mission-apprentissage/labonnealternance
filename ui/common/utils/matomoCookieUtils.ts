export const getCookie = (cookieName) => {
  const cookiePattern = new RegExp("(^|;)[ ]*" + cookieName + "=([^;]*)"),
    cookieMatch = cookiePattern.exec(document.cookie)
  return cookieMatch ? window.decodeURIComponent(cookieMatch[2]) : 0
}
export const setCookie = (cookieName, value, msToExpire) => {
  const expiryDate = new Date()
  expiryDate.setTime(new Date().getTime() + msToExpire)
  document.cookie = cookieName + "=" + window.encodeURIComponent(value) + (msToExpire ? ";expires=" + expiryDate.toString() : "") + ";path=/;domain=;SameSite=Lax"
}
export const COOKIE_REMOVE_TIME = -36 * 60 * 60 * 1000
export const MTM_CONSENT_COOKIE_DURATION = 30 * 365 * 24 * 60 * 60 * 1000

export const CONSENT_REMOVED_COOKIE_NAME = "mtm_consent_removed"
export const CONSENT_COOKIE_NAME = "mtm_consent"

export const setIsTrackingEnabled = () => {
  const consentRemovedCookie = getCookie(CONSENT_REMOVED_COOKIE_NAME)
  if (consentRemovedCookie) {
    optUserOut()
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
