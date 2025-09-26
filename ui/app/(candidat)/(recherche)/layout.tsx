import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"

export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#search-form" },
          { label: "Contenu", anchor: "#search-content-container" },
        ]}
      />
      {children}
    </>
  )
}
