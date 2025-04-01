import { createContext, FC, PropsWithChildren, useState } from "react"

interface ItLogoContext {
  organisation: string
  setOrganisation: (organisation: string) => void
}

const LogoContext = createContext<ItLogoContext>({
  organisation: "",
  setOrganisation: () => {},
})

interface Props extends PropsWithChildren {
  initialLogo?: string
}

const LogoProvider: FC<Props> = ({ initialLogo, children }) => {
  const [organisation, setOrganisation] = useState<string>(initialLogo)

  return <LogoContext.Provider value={{ organisation, setOrganisation }}>{children}</LogoContext.Provider>
}

export { LogoContext }
export default LogoProvider
