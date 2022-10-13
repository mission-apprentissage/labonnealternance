import React from "react";
import Navigation from "../components/navigation";
import ScrollToTop from "../components/ScrollToTop";
import Breadcrumb from "../components/breadcrumb";
import { NextSeo } from "next-seo";

import Footer from "../components/footer";
import ExternalLink from "../components/externalLink";

const developpeurs = () => (
  <div>
    <NextSeo
      title="Développeurs | La Bonne Alternance | Trouvez votre alternance"
      description="Afin de faciliter l’accès aux informations pour les publics là où ils se trouvent, nous avons développé 4 API et un Widget"
    />
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="developpeurs" label="Développeurs" />

    <div className="c-page-container container my-0 mb-sm-5 p-5">
      <div className="row">
        <div className="col-12 col-md-5">
          <h1>
            <span className="d-block c-page-title is-color-2">Développeurs</span>
          </h1>
          <hr className="c-page-title-separator" align="left" />
        </div>
        <div className="col-12 col-md-7">
          <h3>Code source ouvert</h3>
          <ExternalLink
            url="https://github.com/mission-apprentissage/labonnealternance"
            title="LBA - Recherche d'une formation et/ou d'un organisme de formation en apprentissage"
          />
          <h3 className="mt-3">Données ouvertes</h3>
          <p>
            Afin de faciliter l’accès aux informations pour les publics là où ils se trouvent (notamment sur votre site
            internet !), nous avons développé 4 API et un Widget, disponibles en open source.
          </p>
          <p>Testez le widget et les API et accédez à leur documentation sur le site API.gouv</p>
          <ExternalLink
            url="https://api.gouv.fr/les-api/api-la-bonne-alternance"
            title="https://api.gouv.fr/les-api/api-la-bonne-alternance"
          />
        </div>
      </div>
    </div>
    <div className="mb-3">&nbsp;</div>
    <Footer />
  </div>
);

export default developpeurs;
