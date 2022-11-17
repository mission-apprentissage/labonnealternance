import React from "react"
import NextLink from "next/link"
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, Container, Link } from "@chakra-ui/react"
import { ChevronRightIcon } from "@chakra-ui/icons"

const BreadcrumbLinks = (props) => {
  return props.items.map((item, index) => {
    return (
      <BreadcrumbItem key={index} {...props}>
        <NextLink passHref href={{ pathname: `/${item.path}` }}>
          <BreadcrumbLink>{item.title}</BreadcrumbLink>
        </NextLink>
        {index < props.items.length - 1 ? <BreadcrumbSeparator /> : ""}
      </BreadcrumbItem>
    )
  })
}

const BreadcrumbComponent = ({ forPage, label, items = null }) => {
  return (
    <Box display={["none", "block"]}>
      <Container fontSize="12px" variant="responsiveContainer" pl={0} pt={4} pb={4} display="flex">
        <Breadcrumb separator={<ChevronRightIcon fontSize="1.25rem" color="grey.800" />}>
          <BreadcrumbItem>
            <NextLink href={{ pathname: "/" }} passHref>
              <Link>Accueil</Link>
            </NextLink>
          </BreadcrumbItem>

          {!items ? (
            <BreadcrumbItem isCurrentPage>
              <NextLink href={{ pathname: `/${forPage}` }} passHref>
                <BreadcrumbLink>{label}</BreadcrumbLink>
              </NextLink>
            </BreadcrumbItem>
          ) : (
            <BreadcrumbLinks items={items} />
          )}
        </Breadcrumb>
      </Container>
    </Box>
  )
}

export default BreadcrumbComponent
