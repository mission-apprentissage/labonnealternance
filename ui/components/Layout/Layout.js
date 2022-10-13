import React from "react";

import "./layout.module.css";

const Layout = ({ children }) => {
  return (
    <>
      <div className="App">{children}</div>
    </>
  );
};

export default Layout;
