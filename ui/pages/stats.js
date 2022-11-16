import React from "react";
import Navigation from "components/navigation";
import ScrollToTop from "components/ScrollToTop";
import Breadcrumb from "components/breadcrumb";

import Footer from "components/footer";

const stats = () => (
  <div>
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="stats" label="Statistiques" />

    <div className="c-page-container container my-0 mb-sm-5 p-5">
      <div className="row">
        <div className="col-12 col-md-5">
          <h1>
            <span className="d-block c-page-title is-color-2">Statistiques</span>
          </h1>
          <hr className="c-page-title-separator" align="left" />
        </div>
        <div className="col-12 col-md-7">
          <h3>Statistiques</h3>
          <p>
            La bonne alternance est une startup d’Etat incubée par beta.gouv. Nous développons un service à destination
            des publics selon les principes du{" "}
            <a href="https://beta.gouv.fr/approche/manifeste" aira-label="Accès au site de Beta gouv">Manifeste de beta.gouv</a>
          </p>
          <p>
            Nous mesurons l’impact de nos actions et publions en toute transparence nos statistiques que vous pouvez{" "}
            <a href="https://datastudio.google.com/reporting/1v-Sim2qMlFSMn4n9JJWaMk8PIONvM757" aria-label="Accès aux statistiques du service">consulter ici</a>
          </p>
        </div>
      </div>
    </div>
    <div className="mb-3">&nbsp;</div>
    <Footer />
  </div>
);

export default stats;
