import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"

export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#header-links" },
          { label: "Contenu", anchor: "#search-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      {children}
    </>
  )
}
