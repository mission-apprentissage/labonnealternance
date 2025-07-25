import { Link as ChakraLink, LinkProps } from "@chakra-ui/react"
import NavLink from "next/link"
import React, { PropsWithChildren } from "react"

interface Props extends LinkProps {
  shallow?: boolean
}

const Link = ({ children, href, shallow = false, ...rest }: PropsWithChildren<Props>) => {
  return (
    <NavLink legacyBehavior href={href} passHref shallow={shallow}>
      <ChakraLink {...rest}>{children}</ChakraLink>
    </NavLink>
  )
}

export default Link
