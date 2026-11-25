"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu"
import { useEffect, useState } from "react"

type SommaireAProposProps = {
  entries: { id: string; label: string }[]
}

export const SommaireAPropos = ({ entries }: SommaireAProposProps) => {
  const [activeId, setActiveId] = useState(entries[0]?.id)

  useEffect(() => {
    const sections = entries.map(({ id }) => document.getElementById(id)?.closest("section")).filter((section): section is HTMLElement => Boolean(section))
    // Bande d'observation dans le tiers haut de l'écran : la section active est celle qui la traverse.
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed.find((entry) => entry.isIntersecting)
        const id = visible?.target.getAttribute("aria-labelledby")
        if (id) setActiveId(id)
      },
      { rootMargin: "-20% 0px -70% 0px" }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [entries])

  return (
    <SideMenu
      title="Sommaire"
      burgerMenuButtonText="Sommaire"
      sticky
      classes={{ title: fr.cx("fr-hidden", "fr-unhidden-md") }}
      style={{ marginTop: fr.spacing("6v") }}
      items={entries.map(({ id, label }) => ({ text: label, isActive: id === activeId, linkProps: { href: `#${id}` } }))}
    />
  )
}
