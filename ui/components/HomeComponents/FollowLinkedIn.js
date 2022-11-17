import React from "react"

import linkedIn from "../../public/images/icons/linkedin.svg"
import ExternalLink from "../externalLink"

const FollowLinkedIn = () => {
  return (
    <section className="c-follow-linkedin c-homecomponent__blue p-3 mb-5 d-flex">
      <div className="ml-5">
        <p className="c-follow-linkedin-text mb-2 mt-3">
          La mission interministérielle pour l’apprentissage et les trajectoires professionnelles construit des services numériques qui facilitent les entrées en apprentissage.
        </p>
        <p className="c-follow-linkedin-title">Rendez-vous sur LinkedIn pour suivre nos actualités</p>
      </div>
      <div className="c-follow-linkedin-cta d-flex-center">
        <ExternalLink
          className="c-follow-linkedin-button px-3 py-2 mx-3 d-flex"
          url="https://www.linkedin.com/company/mission-apprentissage"
          aria-label="Accès à la page Linkedin de la mission interministérielle pour l’apprentissage et les trajectoires professionnelles"
          title="Voir notre page &nbsp;"
          withPic={<img src={linkedIn} alt="Lien" />}
        />
      </div>
    </section>
  )
}

export default FollowLinkedIn
