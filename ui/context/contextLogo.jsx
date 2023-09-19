import { createContext, useState } from "react"

const LogoContext = createContext({
  organisation: "",
  setOrganisation: () => {},
})

const LogoProvider = (props) => {
  const [organisation, setOrganisation] = useState("")
  let state = { organisation, setOrganisation }

  return <LogoContext.Provider value={state}>{props.children}</LogoContext.Provider>
}

export { LogoContext }
export default LogoProvider
