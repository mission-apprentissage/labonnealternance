import { Icon } from "@chakra-ui/react"
import React from "react"

export function ExternalLinkLine(props) {
  return (
    <Icon viewBox="0 0 12 12" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.66667 2V3.33333H1.33333V10.6667H8.66667V7.33333H10V11.3333C10 11.7015 9.70152 12 9.33333 12H0.666667C0.298477 12 0 11.7015 0 11.3333V2.66667C0 2.29848 0.298477 2 0.666667 2H4.66667ZM12 0V5.33333H10.6667V2.27533L5.47133 7.47133L4.52867 6.52867L9.72333 1.33333H6.66667V0H12Z"
        fill="currentColor"
      />
    </Icon>
  )
}
