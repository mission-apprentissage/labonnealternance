import React from "react";
import NextLink from "next/link";
import { Box, Container, Link } from "@chakra-ui/react";

import separator from "../public/images/breadcrumb_separator.svg";

const Breadcrumb = ({ forPage, label, items = null }) => {
  return (
    <Box display={["none","block"]}>
      <Container fontSize="12px" variant="responsiveContainer" pl={0} pt={4} pb={4} display="flex">
        <NextLink href={{ pathname: "/" }} passHref>
          <Link>Accueil</Link>
        </NextLink>

        {!items ? (
          <>
            <Box mt="4px" mx={4}>
              <img src={separator} alt="" />
            </Box>
            {forPage ? <NextLink href={{ pathname: `/${forPage}` }} passHref><Link>{label}</Link></NextLink> : <div></div>}
          </>
        ) : (
          <>
            {items.map((item, index) => {
              return (
                <Box display="flex" key={index}>
                  <Box mt="4px" mx={4}>
                    <img src={separator} alt="" />
                  </Box>
                  <NextLink passHref href={{ pathname: `/${item.path}` }}><Link>{item.title}</Link></NextLink>
                </Box>
              );
            })}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Breadcrumb;
