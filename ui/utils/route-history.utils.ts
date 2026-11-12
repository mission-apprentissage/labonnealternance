/**
 * Chemin affiché à un instant `performance.now()` : web-vitals rapporte l'INP au départ de la page, pas au moment
 * de l'interaction. Les chemins restent dans le navigateur (cf. toRouteTemplate).
 */
export const createRouteHistory = (limit = 50) => {
  const entries: { time: number; path: string }[] = []
  return {
    record(path: string, time: number) {
      if (entries.at(-1)?.path === path) return
      entries.push({ time, path })
      if (entries.length > limit) entries.shift()
    },
    pathAt(time: number): string | undefined {
      let path = entries[0]?.path
      for (const entry of entries) {
        if (entry.time > time) break
        path = entry.path
      }
      return path
    },
  }
}

export type IRouteHistory = ReturnType<typeof createRouteHistory>
