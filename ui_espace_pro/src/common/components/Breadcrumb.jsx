import React from "react";
import { BreadcrumbItem, BreadcrumbLink, Breadcrumb as ChakraBreadcrumb } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ArrowDropRightLine } from "../../theme/components/icons";

/**
 * @description Breadcrumb components.
 * @param pages
 * @param loading
 * @return {JSX.Element}
 * @constructor
 */
const Breadcrumb = ({ pages, loading = false }) => {
  return (
    <ChakraBreadcrumb
      separator={<ArrowDropRightLine color="grey.600" boxSize={3} mb={1} />}
      textStyle="xs"
      color={"grey.800"}
    >
      {pages.map((page, index) => {
        if (index === pages.length - 1 || !page.to) {
          return (
            <BreadcrumbItem key={page.title} isCurrentPage>
              <BreadcrumbLink textDecoration="none" _hover={{ textDecoration: "none" }} cursor="default">
                {page.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        } else {
          return (
            <BreadcrumbItem key={page.title}>
              <BreadcrumbLink
                as={NavLink}
                to={page.to}
                color={"grey.600"}
                textDecoration="underline"
                _focus={{ boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" }}
                _focusVisible={{ outlineColor: "#2A7FFE" }}
              >
                {page.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        }
      })}
    </ChakraBreadcrumb>
  );
};

export { Breadcrumb };
