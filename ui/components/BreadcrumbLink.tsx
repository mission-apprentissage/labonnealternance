import { BreadcrumbLink as ChakraBreadcrumbLink } from "@chakra-ui/react"
import NavLink from "next/link"

const BreadcrumbLink = ({ children, href, shallow = false, ...rest }) => {
  return (
    <NavLink href={href} passHref shallow={shallow}>
      <ChakraBreadcrumbLink {...rest}>{children}</ChakraBreadcrumbLink>
    </NavLink>
  )
}

export default BreadcrumbLink
