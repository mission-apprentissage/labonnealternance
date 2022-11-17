import React from "react"
import { Icon } from "@chakra-ui/react"

/**
 * @description Check icon.
 * @param {Object} props
 * @return {JSX.Element}
 */
export const Check = (props) => (
  <Icon viewBox="0 0 20 20" {...props}>
    <rect width="20" height="20" rx="4" fill="#3A55D1" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8.88892 11.7613L13.9956 6.65405L14.7817 7.43961L8.88892 13.3324L5.35336 9.79683L6.13892 9.01127L8.88892 11.7613Z"
      fill="white"
    />
  </Icon>
)
