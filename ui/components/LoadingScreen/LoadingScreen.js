import React from "react";
import { Spinner } from "reactstrap";

const LoadingScreen = () => {
  return (
    <div className="c-loading-screen">
      <div>Chargement en cours, veuillez patienter :)</div>
      <div><Spinner color="primary"/></div>
    </div>
  );
};

export default LoadingScreen;
