import { createContext, FC, PropsWithChildren, useState } from "react"

type IContextWidget = {
  isWidget: boolean
  mobile: boolean
}

interface ItWidgetContext {
  widget?: IContextWidget
  setWidget: (widget?: IContextWidget) => void
}

const WidgetContext = createContext<ItWidgetContext>({
  widget: { isWidget: false, mobile: false },
  setWidget: () => {},
})

interface Props extends PropsWithChildren {
  initialWidget?: IContextWidget
}

const WidgetProvider: FC<Props> = ({ initialWidget = { isWidget: false, mobile: false }, children }) => {
  const [widget, setWidget] = useState<IContextWidget | undefined>(initialWidget)

  return <WidgetContext.Provider value={{ widget, setWidget }}>{children}</WidgetContext.Provider>
}

export { WidgetContext }
export default WidgetProvider
