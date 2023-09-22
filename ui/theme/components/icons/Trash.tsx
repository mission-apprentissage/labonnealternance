import { Icon } from "@chakra-ui/react"
import React from "react"

export function Trash(props) {
  return (
    <Icon viewBox="0  0 20 20" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 2H20V4H18V19C18 19.5523 17.5523 20 17 20H3C2.44772 20 2 19.5523 2 19V4H0V2H5V0H15V2ZM7 7V15H9V7H7ZM11 7V15H13V7H11Z"
        fill="currentColor"
      />
    </Icon>
  )
}
