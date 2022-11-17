import React from "react"

import { useRouter } from "next/router"

const SatisfactionFormSuccess = () => {
  const router = useRouter()

  const readIntention = () => {
    const { intention } = router?.query ? router.query : { intention: "intention" }
    return intention
  }

  return (
    <div className="container flex-center pt-5" data-testid="SatisfactionFormSuccess">
      <div className="row flex-center py-5">
        <div className="col col-lg-7 mx-auto">
          <h1 className="h4 text-center">
            <strong>Merci d&apos;avoir pris le temps d&apos;envoyer un message au candidat. </strong>
          </h1>
          {readIntention() === "ne_sais_pas" || readIntention() === "entretien" ? (
            <>
              <p className="pt-3 halflead text-center">Il dispose désormais de vos coordonnées pour poursuivre l&apos;échange.</p>
            </>
          ) : (
            <>
              <p className="pt-3 halflead text-center">
                Cela permet aux futurs alternants de comprendre les raisons du refus, et de s&apos;améliorer pour leurs prochaines candidatures.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SatisfactionFormSuccess
