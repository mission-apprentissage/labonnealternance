export const SendPlausibleEvent = (name: string, props: Record<string, string> = undefined) => {
  // @ts-expect-error: TODO
  if (typeof window !== "undefined" && window.plausible) {
    // @ts-expect-error: TODO
    window.plausible(name, { props })
  }
}
