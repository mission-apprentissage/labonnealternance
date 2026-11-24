export const SendPlausibleEvent = (name: string, props: Record<string, string> = undefined) => {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, { props })
  }
}
