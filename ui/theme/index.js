import { extendTheme } from "@chakra-ui/react"
import { components } from "./components"
import { colors, fonts, rootFontSizePx } from "./theme-beta"

const styles = {
  global: {
    "html, body": {
      fontSize: `${rootFontSizePx}px`,
      fontFamily: "Marianne, Arial",
      background: "white",
    },
  },
}

const theme = {
  fonts,
  colors: { ...colors },
  // styles,
  // fontSizes,
  // textStyles,
  // space,
  components,
}

export default extendTheme(theme)
