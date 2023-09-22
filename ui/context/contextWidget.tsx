import { createContext, FC, PropsWithChildren, useState } from "react"

export type IContextWidget = {
  isWidget: boolean
  mobile: boolean
}

interface ItWidgetContext {
  widget?: IContextWidget
  setWidget: (widget?: IContextWidget) => void
}

const WidgetContext = createContext<ItWidgetContext>({
  widget: undefined,
  setWidget: () => {},
})

interface Props extends PropsWithChildren {
  initialWidget?: IContextWidget
}

export const WidgetProvider: FC<Props> = ({ initialWidget, children }) => {
  const [widget, setWidget] = useState<IContextWidget | undefined>(initialWidget)

  return <WidgetContext.Provider value={{ widget, setWidget }}>{children}</WidgetContext.Provider>
}

export { WidgetContext }
export default WidgetProvider
