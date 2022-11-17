import React from "react"
import ConnectionActions from "./ConnectionActions"

const CFA = () => {
  return (
    <section className="p-3 mb-2 mb-md-5">
      <div className="row">
        <div className="col-12 col-md-6 d-none d-md-block">
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-entreprisesmandatees.svg" alt="" />
        </div>
        <div className="col-12 col-md-6 order-md-first">
          <h1 className="c-homecomponent-title c-homecomponent-title__blue mb-3">Vous êtes un organisme de formation</h1>
          <h2 className="c-homecomponent-title__small mb-3 mb-lg-5">Diffusez et gérez simplement les offres d’emploi de vos entreprises partenaires.</h2>
          <div>Créez le compte de votre CFA pour administrer vos offres et être contacté par des entreprises à la recherche d’alternants.</div>
          <ConnectionActions service="cfa" />
        </div>
      </div>
    </section>
  )
}

export default CFA
