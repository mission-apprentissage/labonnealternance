import React from "react"
export default function getSurtitre({ selectedItem, kind, isMandataire }) {
  let res = ""
  let companyName = selectedItem?.company?.name || ""

  if (kind === "matcha" && isMandataire) {
    res = (
      <p className={`c-detail-activity c-detail-title--entreprise mt-2`}>
        <span className="c-detail-activity__proposal">Le centre de formation&nbsp;</span>
        <span>{companyName}</span>
        <span className="c-detail-activity__proposal">&nbsp;propose actuellement cette offre dans le domaine suivant</span>
      </p>
    )
  }

  if (kind === "peJob" || (kind === "matcha" && !isMandataire)) {
    res = (
      <p className={`c-detail-activity c-detail-title--entreprise mt-2`}>
        {companyName ? (
          <>
            <span>{companyName}</span>
            <span className="c-detail-activity__proposal">&nbsp;propose actuellement cette offre</span>
          </>
        ) : (
          <>
            <span className="c-detail-activity__proposal">
              {selectedItem?.nafs ? (
                <>
                  Une société du secteur&nbsp;<bold>${selectedItem.nafs[0].label}</bold>&nbsp;propose actuellement cette offre
                </>
              ) : (
                "Une société ayant souhaité garder l'anonymat"
              )}
            </span>
          </>
        )}
      </p>
    )
  }

  if (kind === "lbb" || kind === "lba") {
    res = (
      <p className={`c-detail-activity c-detail-title--entreprise mt-2`}>
        <span>{companyName}</span>
        <span className="c-detail-activity__proposal">&nbsp;a des salariés qui exercent le métier auquel vous vous destinez. Envoyez votre candidature spontanée !</span>
      </p>
    )
  }

  if (kind === "formation") {
    res = (
      <p className={`c-detail-activity c-detail-title--formation`}>
        <span>{`${companyName} (${selectedItem.company.place.city})`}</span>
        <span className="c-detail-activity__proposal">&nbsp;propose cette formation</span>
      </p>
    )
  }

  return res
}
