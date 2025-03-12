export const isWidget = () => {
  if (typeof window === "undefined") {
    return false
  }
  return window.parent !== window.self
}
