import React from "react";
import ExternalLink from "../externalLink";

const ConnectionActions = ({ service }) => {
  return (
    <div className="my-4 mx-auto">
      {service === "entreprise" ? (
        <ExternalLink
          className="c-homecomponent-link c-homecomponent-link__first mr-1 mr-md-5"
          url="https://matcha.apprentissage.beta.gouv.fr/creation/entreprise"
          title="Déposer une offre"
        />
      ) : (
        ""
      )}
      {service === "cfa" ? (
        <ExternalLink
          className="c-homecomponent-link c-homecomponent-link__first mr-1 mr-md-5"
          url="https://matcha.apprentissage.beta.gouv.fr/creation/cfa"
          title="Créer mon espace dédié"
        />
      ) : (
        ""
      )}
      <ExternalLink
        className="c-homecomponent-link c-homecomponent-link__clear"
        url="https://matcha.apprentissage.beta.gouv.fr/authentification"
        title="Me connecter"
      />
    </div>
  );
};
export default ConnectionActions;
