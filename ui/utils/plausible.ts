export const SendPlausibleEvent = (name, props = undefined) => {
  // @ts-expect-error: TODO
  if (typeof window !== "undefined" && window.plausible) {
    // @ts-expect-error: TODO
    window.plausible(name, { props })
  }
}
