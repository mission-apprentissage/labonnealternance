import React from "react"

const AlgoRecruiter = () => {
  return (
    <section className="c-algo container pl-5 py-4 mb-4">
      <div className="">
        <h2 className="c-algo-title">
          <span className="d-block c-algo-title__top">La bonne alternance révèle</span>
          <span className="d-block c-algo-title__down">le marché caché de l&apos;emploi</span>
        </h2>
        <hr className="c-page-title-separator" align="left"></hr>
        <p className="c-algo-text">
          Le saviez-vous ? Afin d&apos;aider les candidats intéressés par l&apos;alternance à trouver un contrat, nous exposons différents types d&apos;entreprises sur notre
          service :
        </p>
        <ul className="c-algo-text">
          <li>
            <strong>Celles ayant émis un besoin en recrutement </strong>sur notre plateforme ainsi que sur Pôle emploi et ses sites partenaires
          </li>
          <li className="pt-3">
            <strong>Celles n&apos;ayant pas diffusé d&apos;offres, mais ayant été identifiées comme &quot;à fort potentiel d&apos;embauche en alternance&quot;</strong> par un
            algorithme prédictif de Pôle emploi, qui analyse les recrutements des 6 années passées en CDI, CDD de plus de 30 jours et alternance. L’objectif de cet algorithme est
            de rendre accessible le marché caché de l’emploi, et ainsi faciliter les démarches de candidatures spontanées des usagers du service.
          </li>
        </ul>
      </div>
      <div className="c-algo-img d-flex-center">
        <img className="" src="/images/icons/algo_recruiter.svg" alt="" />
      </div>
    </section>
  )
}

export default AlgoRecruiter
