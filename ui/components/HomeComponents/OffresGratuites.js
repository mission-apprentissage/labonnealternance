import React from "react";
import ExternalLink from "../externalLink";

const OffresGratuites = () => {
  return (
    <section className="p-3 mb-2 mb-md-5">
      <div className="row">
        <div className="col-12 col-md-6">
          <img
            className="c-homecomponent-illustration mr-3 my-3"
            src="/images/home_pics/illu-plateformesjeunes.svg"
            alt=""
          />
        </div>
        <div className="col-12 col-md-6 pt-md-5 order-md-first">
          <h2 className="c-homecomponent-title__small mb-3">
            Diffusez gratuitement vos offres au plus près des candidats
          </h2>
          <div>
            Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
            <ExternalLink
              className="c-homecomponent-link__inline"
              url="https://labonnealternance.pole-emploi.fr"
              title="La bonne alternance"
            />
            ,{" "}
            <ExternalLink
              className="c-homecomponent-link__inline"
              url="https://www.1jeune1solution.gouv.fr"
              title="1jeune1solution"
            />
            ,{" "}
            <ExternalLink className="c-homecomponent-link__inline" url="https://www.parcoursup.fr" title="Parcoursup" />{" "}
            et bien d’autres.
          </div>
        </div>
      </div>
    </section>
  );
};
export default OffresGratuites;
