import React from "react"

const BientotCFA = () => {
  return (
    <section className="p-3 mb-2 mb-md-5">
      <div className="row">
        <div className="col-12 col-md-6 pt-md-5">
          <div className="c-homecomponent-bientot mb-2 d-block d-md-none mt-3">Bientôt</div>
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-offrecouplee.svg" alt="" />
        </div>
        <div className="col-12 col-md-6">
          <div className="c-homecomponent-bientot mb-4 d-none d-md-block">Bientôt</div>
          <h2 className="c-homecomponent-title__small mb-3">Rattachez vos formations aux offres que vous gérez, pour les rendre plus visibles</h2>
          <div>En associant une formation à une offre, attirez plus de jeunes avec des offres complètes regroupant formation et emploi.</div>
          <h2 className="c-homecomponent-title__small mb-3 mt-4">Identifiez de nouvelles entreprises partenaires</h2>
          <div>Découvrez le marché du travail pour chacune de vos offres de formation.</div>
        </div>
      </div>
    </section>
  )
}

export default BientotCFA
