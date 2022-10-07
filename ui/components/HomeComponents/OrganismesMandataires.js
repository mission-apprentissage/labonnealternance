import React from "react";

const OrganismesMandataires = () => {
  return (
    <section className="p-3 mb-2 mb-md-5">
      <div className="row">
        <div className="col-12 col-md-6">
          <img
            className="c-homecomponent-illustration mr-3 my-3"
            src="/images/home_pics/illu-solliciterCFA.svg"
            alt=""
          />
        </div>
        <div className="col-12 col-md-6 pt-md-5">
          <h2 className="c-homecomponent-title__small mb-3">
            Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
          </h2>
          <div>
            Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin
            d’accélérer vos recrutements.
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrganismesMandataires;
