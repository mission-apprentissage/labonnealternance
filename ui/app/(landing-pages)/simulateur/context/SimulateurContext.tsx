"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useState } from "react"
import type { OuputSimulation } from "@/services/simulateurAlternant"

type SimulateurContextType = {
  simulation: OuputSimulation | null
  setSimulation: (simulation: OuputSimulation) => void
  resetSimulation: () => void
}

const SimulateurContext = createContext<SimulateurContextType | undefined>(undefined)

export const SimulateurProvider = ({ children }: { children: ReactNode }) => {
  const [simulation, setSimulation] = useState<OuputSimulation | null>(null)

  const resetSimulation = () => setSimulation(null)

  return <SimulateurContext.Provider value={{ simulation, setSimulation, resetSimulation }}>{children}</SimulateurContext.Provider>
}

export const useSimulateur = () => {
  const context = useContext(SimulateurContext)
  if (context === undefined) {
    throw new Error("useSimulateur must be used within a SimulateurProvider")
  }
  return context
}
