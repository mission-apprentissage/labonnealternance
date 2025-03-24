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
  ...props
}: {
  children: ReactNode
  arrow?: "right" | "left" | "none"
  size?: "lg" | "sm" | "md"
  external?: "auto" | boolean
  style?: CSSProperties
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

  return (
    <NextLink
      style={{ textUnderlinePosition: "under", ...style }}
      href={href}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      className={fr.cx(
        `fr-text--${size}`,
        "fr-link",
        {
          "fr-link--sm": size === "sm",
          "fr-link--lg": size === "lg",
          "fr-link--icon-left": true, // arrow === "left",
          "fr-icon-arrow-left-s-line": arrow === "left",
          "fr-icon-arrow-right-line": arrow === "right",
          "fr-link--icon-right": arrow === "right",
        },
        "fr-icon-map-pin-2-fill"
      )}
      {...rest}
    >
      {children}
    </NextLink>
  )
}
