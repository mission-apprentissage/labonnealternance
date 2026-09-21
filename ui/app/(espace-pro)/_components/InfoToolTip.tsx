"use client"

import { fr } from "@codegouvfr/react-dsfr"
import type React from "react"
import { useId } from "react"

/**
 * Infobulle d'information au clic, en markup DSFR natif : un <button> nommé, relié au contenu par
 * aria-describedby, contenu en role="tooltip", fermeture à Échap et persistance au survol
 * (RGAA 1.1, 7.1, 7.3, 10.13).
 *
 * Le `Tooltip` de react-dsfr n'est pas utilisable ici : son déclencheur porte un libellé figé
 * (« Information contextuelle », issu de son i18n interne) et n'expose aucune prop pour le
 * surcharger. Toutes les infobulles d'une même page partageraient alors le même nom accessible,
 * alors que l'écran « Informations de l'entreprise » en aligne une par champ. On rend donc le
 * markup documenté par le DSFR : son JS câble le déclencheur via le sélecteur
 * `[aria-describedby="<id de l'infobulle>"]`, les comportements clavier et souris sont donc les
 * mêmes qu'avec le composant React.
 *
 * `label` nomme le déclencheur pour les technologies d'assistance (ex. « Informations sur
 * l'enseigne »). Il reste invisible : `.fr-btn--tooltip` borne le bouton à 2 rem et masque le
 * débordement, seul le picto « ? » rendu en ::before est affiché.
 */
export const InfoTooltip = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const id = `tooltip-${useId()}`

  return (
    <>
      <button className={fr.cx("fr-btn--tooltip", "fr-btn")} aria-describedby={id} id={`tooltip-owner-${id}`} type="button">
        {label}
      </button>
      <span className={fr.cx("fr-tooltip", "fr-placement")} id={id} role="tooltip">
        {children}
      </span>
    </>
  )
}
