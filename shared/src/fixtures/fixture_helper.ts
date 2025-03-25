export function getFixtureValue<D, K extends keyof D>(data: Partial<D> | undefined, key: K, defaultValue: D[K]): D[K] {
  return data && key in data ? (data[key] as D[K]) : defaultValue
}
