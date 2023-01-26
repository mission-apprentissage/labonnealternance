export const SendPlausibleEvent = (name, props) => {
  if (typeof window !== "undefined" && window?.plausible) {
    window.plausible(name, { props })
  }
}
