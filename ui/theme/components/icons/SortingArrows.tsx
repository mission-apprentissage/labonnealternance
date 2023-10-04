import { Icon } from "@chakra-ui/react"
// import { getColor } from "@chakra-ui/theme-tools";
import React from "react"

export function SortingArrows({ disabledColor, ...props }) {
  // const disabledColorHex = getColor(theme, disabledColor, c)
  return (
    <Icon viewBox="0 0 6 10" width="6px" height="10px" {...props}>
      <path d="M3.00004 0.666504L5.66671 3.33317H0.333374L3.00004 0.666504Z" fill={props.sorting === "none" || props.sorting === "asc" ? "currentColor" : disabledColor} />
      <path d="M3.00004 9.33317L0.333374 6.6665H5.66671L3.00004 9.33317Z" fill={props.sorting === "none" || props.sorting === "desc" ? "currentColor" : disabledColor} />
    </Icon>
  )
}
