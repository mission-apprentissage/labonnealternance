import { Link as ChakraLink } from "@chakra-ui/react"
import NavLink from "next/link"
import React from "react"

const Link = ({ children, href, shallow = false, ...rest }) => {
  return (
    <NavLink legacyBehavior href={href} passHref shallow={shallow}>
      <ChakraLink {...rest}>{children}</ChakraLink>
    </NavLink>
  )
}

export default Link
