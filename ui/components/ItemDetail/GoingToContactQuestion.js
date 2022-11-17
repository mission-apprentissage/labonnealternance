import React from "react"

import { useSessionStorage } from "../../utils/useSessionStorage"
import { getItemId } from "../../utils/getItemId"
import { SendPlausibleEvent } from "../../utils/plausible"
import { capitalizeFirstLetter } from "../../utils/strutils"

const GoingToContactQuestion = ({ kind, uniqId, item }) => {
  const [thanks, setThanks] = useSessionStorage(uniqId, false)

  const workplace = kind === "formation" ? "cet établissement" : "cette entreprise"

  const getType = () => {
    if (kind === "formation") {
      return "formation"
    }
    if (kind === "peJob") {
      return "entreprise Offre PE"
    }
    return "entreprise Algo"
  }

  const typeForEventTracking = getType()

  return (
    <div className="c-detail-body c-goingto mt-4" data-testid="GoingToContactQuestion">
      <div className="c-goingto-title">Allez-vous contacter {workplace} ?</div>
      <div className="">
        {thanks ? (
          <>
            <div className="c-goingto-thanks mt-3">
              <span>Merci pour votre réponse ! 👌</span>
            </div>
          </>
        ) : (
          <>
            <div className="c-goingto-buttons">
              <button
                type="button"
                className={`c-goingto-thumb gtmThumbUp gtm${capitalizeFirstLetter(kind)}`}
                onClick={() => {
                  setThanks(true)
                  SendPlausibleEvent(`Clic Je vais contacter - Fiche ${typeForEventTracking}`, {
                    info_fiche: getItemId(item),
                  })
                }}
              >
                <span className="ml-1">👍 Oui</span>
              </button>
              <button
                type="button"
                className={`c-goingto-thumb gtmThumbDown gtm${capitalizeFirstLetter(kind)}`}
                onClick={() => {
                  setThanks(true)
                  SendPlausibleEvent(`Clic Je ne vais pas contacter - Fiche ${typeForEventTracking}`, {
                    info_fiche: getItemId(item),
                  })
                }}
              >
                <span className="ml-1">👎 Non</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function getGoingtoId(kind, item) {
  return `goingto-${kind}-${getItemId(item)}`
}

export default GoingToContactQuestion
