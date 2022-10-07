import React from "react";
import Link from "next/link";

import separator from "public/images/breadcrumb_separator.svg";

const Breadcrumb = ({ forPage, label, items = null }) => {
  return (
    <div className="c-breadcrumb d-none d-sm-block">
      <div className="container d-flex pl-0 pt-3 pb-3">
        <Link href={{ pathname: "/" }}>Accueil</Link>

        {!items ? (
          <>
            <div className="c-breadcrumb-separator mx-3">
              <img className="c-breadcrumb-separator-img" src={separator} alt="" />
            </div>
            {forPage ? <Link href={{ pathname: `/${forPage}` }}>{label}</Link> : <div></div>}
          </>
        ) : (
          <>
            {items.map((item, index) => {
              return (
                <span key={index}>
                  <span className="c-breadcrumb-separator mx-3">
                    <img className="c-breadcrumb-separator-img" src={separator} alt="" />
                  </span>
                  <Link href={{ pathname: `/${item.path}` }}>{item.title}</Link>
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
