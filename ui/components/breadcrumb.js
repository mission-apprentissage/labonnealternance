import React from "react";
import NextLink from "next/link";
import { Container, Link } from "@chakra-ui/react";

import separator from "../public/images/breadcrumb_separator.svg";

const Breadcrumb = ({ forPage, label, items = null }) => {
  return (
    <div className="c-breadcrumb d-none d-sm-block">
      <div className="container d-flex pl-0 pt-3 pb-3">
        <NextLink href={{ pathname: "/" }} passHref>
          <Link>Accueil</Link>
        </NextLink>

        {!items ? (
          <>
            <div className="c-breadcrumb-separator mx-3">
              <img className="c-breadcrumb-separator-img" src={separator} alt="" />
            </div>
            {forPage ? <NextLink href={{ pathname: `/${forPage}` }} passHref><Link>{label}</Link></NextLink> : <div></div>}
          </>
        ) : (
          <>
            {items.map((item, index) => {
              return (
                <span key={index}>
                  <span className="c-breadcrumb-separator mx-3">
                    <img className="c-breadcrumb-separator-img" src={separator} alt="" />
                  </span>
                  <NextLink passHref href={{ pathname: `/${item.path}` }}><Link>{item.title}</Link></NextLink>
                </span>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Breadcrumb;
