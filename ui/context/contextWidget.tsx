import { createContext, useState } from "react"

const WidgetContext = createContext({
  widget: {},
  setWidget: () => {},
})

const WidgetProvider = (props) => {
  const [widget, setWidget] = useState({})
  const state = { widget, setWidget }

  return <WidgetContext.Provider value={state}>{props.children}</WidgetContext.Provider>
}

export { WidgetContext }
export default WidgetProvider
