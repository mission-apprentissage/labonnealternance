import React from "react";
import ConnectionActions from "./ConnectionActions";

const Entreprise = () => {
  return (
    <section className="p-3 mb-2 mb-md-5">
      <div className="row">
        <div className="col-12 col-md-6 d-none d-md-block">
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-votrebesoin.svg" alt="" />
          <img className="c-homecomponent-illustration--above1" src="/images/home_pics/1j1s.svg" alt="1 jeune 1 solution" />
          <img className="c-homecomponent-illustration--above2" src="/images/home_pics/parcoursup.svg" alt="parcoursup" />
        </div>
        <div className="col-12 col-md-6 order-md-first">
          <h1 className="c-homecomponent-title c-homecomponent-title__blue mb-3">Vous êtes une entreprise</h1>
          <h2 className="c-homecomponent-title__small mb-3 mb-lg-5">
            Diffusez simplement et gratuitement vos offres en alternance.
          </h2>
          <div>
            Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des
            centres de formation pouvant vous accompagner.
          </div>
          <ConnectionActions service="entreprise" />
        </div>
      </div>
    </section>
  );
};

export default Entreprise;
