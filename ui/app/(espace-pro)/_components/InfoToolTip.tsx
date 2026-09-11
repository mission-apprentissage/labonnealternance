import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip"
import type React from "react"

/**
 * Tooltip d'information DSFR en mode clic : le DSFR rend un <button> nommé (« Information contextuelle »),
 * relié au contenu par aria-describedby, avec role="tooltip", fermeture à la touche Échap et
 * persistance au survol (RGAA 1.1, 7.1, 7.3, 10.13).
 */
export const InfoTooltip = ({ children }: { children: React.ReactNode }) => {
  return <Tooltip kind="click" title={children} />
}
