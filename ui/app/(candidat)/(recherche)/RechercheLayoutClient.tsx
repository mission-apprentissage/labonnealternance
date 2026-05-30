"use client"

import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

const IsWidgetContext = createContext(false)

export function useIsWidget() {
  return useContext(IsWidgetContext)
}

export function RechercheLayoutClient({ header, children }: { header: ReactNode; children: ReactNode }) {
  const [isWidget, setIsWidget] = useState(true)

  useEffect(() => {
    setIsWidget(window.self !== window.top)
  }, [])

  return (
    <IsWidgetContext.Provider value={isWidget}>
      {!isWidget && header}
      {children}
    </IsWidgetContext.Provider>
  )
}
