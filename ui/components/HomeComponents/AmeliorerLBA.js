import React from "react"
import ExternalLink from "../externalLink"

const AmeliorerLBA = () => {
  return (
    <section className="c-homecomponent__blue p-3 mb-5">
      <div className="row">
        <div className="col-12 col-md-6">
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-support.svg" alt="" />
        </div>
        <div className="col-12 col-md-6 mb-5">
          <div className="font-weight-bold mb-2">Donnez votre avis</div>
          <h2 className="c-homecomponent-title__blue mb-4">Aidez-nous à améliorer La bonne alternance</h2>
          La bonne alternance est un service en construction. Pour le faire évoluer, nous interrogeons régulièrement les utilisateurs du service.
          <div className="font-weight-bold">
            Nous vous invitions à participer à un échange en visio d’une trentaine de minutes avec un membre de notre équipe pour répondre à quelques questions et nous partager
            votre avis.
          </div>
          <div className="mt-3">
            <ExternalLink
              className="c-homecomponent-link c-homecomponent-link__clear mt-3"
              aria-label="Planifier un échange avec l'équipe"
              url="https://calendly.com/rdv-labonnealternance/discussion-labonnealternance"
              title="Je participe à l'étude"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
export default AmeliorerLBA
