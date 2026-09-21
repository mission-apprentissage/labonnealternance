import { fr } from "@codegouvfr/react-dsfr"
import type { LinkProps } from "next/link"
import NextLink from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"

import { CONTEXT_CHANGE_HINT, isExternalHref, isHonoredDownload, resolveContextChange } from "./link.utils"

export function DsfrLink({
  children,
  arrow = "none",
  size = "md",
  external = "auto",
  style,
  className,
  download,
  ...props
}: {
  children: ReactNode
  arrow?: "right" | "left" | "none"
  size?: "lg" | "sm" | "md"
  external?: "auto" | boolean
  style?: CSSProperties
  className?: string
  /** Nom du fichier enregistré. Même origine uniquement : ailleurs le navigateur ignore l'attribut. */
  download?: boolean | string
} & LinkProps) {
  const { href, ...rest } = props

  // Un téléchargement effectif ne quitte pas la page : ni target, ni rel, sinon le navigateur
  // ouvre un onglet qui se referme aussitôt (RGAA 6.1).
  const isDownload = useMemo(() => isHonoredDownload(href, download), [href, download])

  const isExternal = useMemo(() => isExternalHref(href, external) && !isDownload, [href, external, isDownload])

  // RGAA 6.1 : l'icône « lien externe » du DSFR est une icône CSS, donc non restituée.
  // Le changement de contexte doit être annoncé dans le nom accessible du lien.
  // Un mailto: ouvre le client de messagerie et non une page : il garde target="_blank"
  // pour ne pas quitter la page courante, mais s'annonce pour ce qu'il fait.
  // Un fichier téléchargé n'ouvre aucune fenêtre : il s'annonce « téléchargement ».
  // Un tel: n'est pas externe (cf. isExternalHref) : ni target, ni annonce.
  const contextChange = useMemo(() => resolveContextChange(href, external, download), [href, external, download])

  return (
    <NextLink
      style={{ textUnderlinePosition: "under", ...style }}
      href={href}
      download={download}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      className={
        className ||
        fr.cx(`fr-text--${size}`, "fr-link", {
          "fr-link--sm": size === "sm",
          "fr-link--lg": size === "lg",
          "fr-link--icon-left": arrow === "left",
          "fr-icon-arrow-left-s-line": arrow === "left",
          "fr-icon-arrow-right-line": arrow === "right",
          "fr-link--icon-right": arrow === "right",
        })
      }
      {...rest}
    >
      {children}
      {contextChange !== null && <span className="fr-sr-only">{CONTEXT_CHANGE_HINT[contextChange]}</span>}
    </NextLink>
  )
}
