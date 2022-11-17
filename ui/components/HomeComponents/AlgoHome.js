import React from "react"
import TagCandidatureSpontanee from "../../components/ItemDetail/TagCandidatureSpontanee.js"
import TagOffreEmploi from "../../components/ItemDetail/TagOffreEmploi.js"

const AlgoHome = () => {
  return (
    <section className="c-algo container">
      <div className="">
        <h2 className="c-algo-title">
          <span className="d-block c-algo-title__top">Vous révéler</span>
          <span className="d-block c-algo-title__down">le marché caché de l&apos;emploi</span>
        </h2>
        <hr className="c-page-title-separator" align="left"></hr>
        <p className="c-algo-text">La bonne alternance expose différents types d&apos;opportunités d&apos;emplois :</p>
        <ul className="c-algo-text">
          <li>
            <strong>Les offres d&apos;emploi</strong> : publiées sur notre plateforme ainsi que celles issues de Pôle emploi et ses partenaires. Elles sont identifiées grâce au tag{" "}
            <TagOffreEmploi />
          </li>
          <li className="pt-3">
            <strong>Les candidatures spontanées</strong> : correspondant au marché caché de l&apos;emploi. Chaque mois, un algorithme prédictif de Pôle emploi analyse les
            recrutements des 6 années passées pour prédire ceux des 6 mois à venir. Grâce à ces données, il identifie une liste restreinte d&apos;entreprises &quot;à fort potentiel
            d&apos;embauche en alternance&quot; pour faciliter vos démarches de candidatures spontanées. Elles sont identifiées grâce au tag <TagCandidatureSpontanee />
          </li>
        </ul>
      </div>
      <div className="c-algo-img d-flex-center">
        <img className="" src="/images/icons/algo_home.svg" alt="" />
      </div>
    </section>
  )
}

export default AlgoHome
