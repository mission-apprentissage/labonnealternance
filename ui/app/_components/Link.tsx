import { Link as ChakraLink, LinkProps } from "@chakra-ui/react"
import NavLink from "next/link"
import React, { PropsWithChildren } from "react"

const Link = ({ children, href, shallow = false, ...rest }: PropsWithChildren<{ href: string; shallow?: boolean } & LinkProps>) => {
  return (
    <NavLink legacyBehavior href={href} passHref shallow={shallow}>
      <ChakraLink {...rest}>{children}</ChakraLink>
    </NavLink>
  )
}

export default Link
