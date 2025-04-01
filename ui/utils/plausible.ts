export const SendPlausibleEvent = <P extends Record<string, string>>(name: string, props: P | undefined = undefined) => {
  // @ts-expect-error: TODO
  if (typeof window !== "undefined" && window.plausible) {
    // @ts-expect-error: TODO
    window.plausible(name, { props })
  }
}
