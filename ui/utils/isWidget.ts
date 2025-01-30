export const isWidget = () => {
  if (typeof window === "undefined") return false
  const { pathname, search } = window.location
  const searchParams = new URLSearchParams(search)
  return pathname.includes("/widget/") || searchParams.get("utm_campaign") === "widget"
}
