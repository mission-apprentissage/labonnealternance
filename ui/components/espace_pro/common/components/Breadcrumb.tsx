import { BreadcrumbItem, BreadcrumbLink, Breadcrumb as ChakraBreadcrumb } from "@chakra-ui/react"
import NavLink from "next/link"
import React from "react"

import { ArrowDropRightLine } from "../../../../theme/components/icons"

/**
 * @description Breadcrumb components.
 * @param pages
 * @param loading
 * @return {JSX.Element}
 * @constructor
 */
export const OldBreadcrumb = ({ pages }) => {
  return (
    <ChakraBreadcrumb ml={4} fontSize={"12px"} separator={<ArrowDropRightLine color="grey.425" boxSize={3} mb={1} />} textStyle="xs">
      {pages.map((page, index) => {
        if (index === pages.length - 1 || !page.to) {
          return (
            <BreadcrumbItem key={page.title} isCurrentPage>
              <BreadcrumbLink textDecoration="none" color="#161616" _hover={{ textDecoration: "none" }} cursor="default">
                {page.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          )
        } else {
          return (
            <BreadcrumbItem key={page.title}>
              <BreadcrumbLink
                legacyBehavior
                as={NavLink}
                href={page.to}
                color="grey.425"
                textDecoration="underline"
                _focus={{ boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" }}
                _focusVisible={{ outlineColor: "#2A7FFE" }}
              >
                {page.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          )
        }
      })}
    </ChakraBreadcrumb>
  )
}
