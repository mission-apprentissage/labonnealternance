import { fr } from "@codegouvfr/react-dsfr"
import type { LinkProps } from "next/link"
import NextLink from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"

import { publicConfig } from "@/config.public"

export function DsfrLink({
  children,
  arrow = "none",
  size = "md",
  external = "auto",
  style,
  className,
  ...props
}: {
  children: ReactNode
  arrow?: "right" | "left" | "none"
  size?: "lg" | "sm" | "md"
  external?: "auto" | boolean
  style?: CSSProperties
  className?: string
  download?: string
} & LinkProps) {
  const { href, ...rest } = props

  const isExternal = useMemo(() => {
    if (typeof external === "boolean") return external
    if (typeof href !== "string") return false
    const url = new URL(href, publicConfig.baseUrl)
    if (url.protocol === "mailto:") return true
    if (url.protocol !== "http:" && url.protocol !== "https:") return false
    return new URL(href, publicConfig.baseUrl).hostname !== publicConfig.host
  }, [href, external])

  // RGAA 6.1 : l'icône « lien externe » du DSFR est une icône CSS, donc non restituée.
  // Le changement de contexte doit être annoncé dans le nom accessible du lien.
  // Les mailto: et tel: reçoivent target="_blank" sans pour autant ouvrir une page :
  // on ne les annonce pas.
  const opensNewWindow = useMemo(() => {
    if (!isExternal) return false
    if (typeof href !== "string") return false
    const { protocol } = new URL(href, publicConfig.baseUrl)
    return protocol === "http:" || protocol === "https:"
  }, [isExternal, href])

  return (
    <NextLink
      style={{ textUnderlinePosition: "under", ...style }}
      href={href}
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
      {opensNewWindow && <span className="fr-sr-only"> - nouvelle fenêtre</span>}
    </NextLink>
  )
}
