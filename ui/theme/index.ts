import { extendTheme } from "@chakra-ui/react"

import { components } from "./components"
import { colors, fonts } from "./theme-beta"

const theme = {
  fonts,
  colors: { ...colors },
  components,
}

export default extendTheme(theme)
