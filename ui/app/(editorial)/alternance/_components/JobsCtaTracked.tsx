"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"

type SearchOrigin = "page_ville" | "page_metier"

type Props = {
  href: string
  searchOrigin: SearchOrigin
  searchJobName?: string
  searchAddress?: string
  children?: React.ReactNode
  size?: "small" | "medium" | "large"
  priority?: "primary" | "secondary" | "tertiary" | "tertiary no outline"
  style?: React.CSSProperties
}

export function JobsCtaTracked({ href, searchOrigin, searchJobName, searchAddress, children, size = "large", priority = "primary", style }: Props) {
  const handleClick = () => {
    pushMatomoEvent({
      event: MATOMO_EVENTS.SEARCH_LAUNCHED,
      search_job_name: searchJobName || "non_renseigné",
      search_address: searchAddress || "non_renseigné",
      search_radius: 30,
      search_diploma: "indifferent",
      search_origin: searchOrigin,
    })
  }

  return (
    <Button linkProps={{ href, onClick: handleClick }} size={size} priority={priority} style={style}>
      {children ?? "Démarrer mes recherches"}
    </Button>
  )
}
