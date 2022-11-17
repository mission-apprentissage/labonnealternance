import React from "react"

const GerezOffres = () => {
  return (
    <section className="c-homecomponent__beige p-3 mb-5">
      <div className="row">
        <div className="col-12 col-md-6">
          <div className="c-homecomponent-bientot mb-4 d-block d-md-none">Bientôt</div>
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-candidatures.svg" alt="" />
        </div>
        <div className="col-12 col-md-6 mb-5">
          <div className="c-homecomponent-bientot mb-4 d-none d-md-block">Bientôt</div>
          <h2 className="c-homecomponent-title__small mb-3">Gérez vos offres de manière collaborative</h2>
          <div>Un accès multi-comptes permettra à plusieurs personnes de votre entreprise d’accéder et de gérer vos offres d&apos;emploi.</div>
          <h2 className="c-homecomponent-title__small mb-3 mt-4">Consultez et gérez vos candidatures</h2>
          <div>Vérifiez d&apos;un coup d&apos;œil la progression des candidatures pour définir les prochaines étapes.</div>
        </div>
      </div>
    </section>
  )
}

export default GerezOffres
