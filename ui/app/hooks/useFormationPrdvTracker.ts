import { useLocalStorage } from "./useLocalStorage"

export const useFormationPrdvTracker = (id: string) => {
  const { storedValue, setLocalStorage } = useLocalStorage<number>(`application-formation-${id}`)
  const appliedDate = storedValue
    ? new Date(storedValue).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null
  const setPrdvDone = () => setLocalStorage(Date.now())

  return { appliedDate, setPrdvDone }
}
