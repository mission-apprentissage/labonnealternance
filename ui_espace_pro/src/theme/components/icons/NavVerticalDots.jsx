import { Icon } from "@chakra-ui/react"
import React from "react"

export function NavVerticalDots(props) {
  return (
    <Icon viewBox="0 0 4 14" {...props}>
      <circle cx="2" cy="2" r="2" fill="#000091" />
      <circle cx="2" cy="7" r="2" fill="#000091" />
      <circle cx="2" cy="12" r="2" fill="#000091" />
    </Icon>
  )
}
