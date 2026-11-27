import { fr } from "@codegouvfr/react-dsfr"
import { Fragment } from "react"

const emphaseStyle = { fontWeight: 700, color: fr.colors.decisions.text.default.info.default }

// Texte éditorial balisé avec **…** : des <strong> pour le SEO, sans injecter de HTML (la page ville passe par dangerouslySetInnerHTML).
export function TexteEmphase({ texte }: { texte: string }) {
  const morceaux = texte.split("**")
  // Nombre pair de morceaux = marqueur non fermé : on rend le texte tel quel.
  if (morceaux.length % 2 === 0) return <>{texte}</>
  return (
    <>
      {morceaux.map((morceau, idx) =>
        idx % 2 === 1 ? (
          <strong key={idx} style={emphaseStyle}>
            {morceau}
          </strong>
        ) : (
          <Fragment key={idx}>{morceau}</Fragment>
        )
      )}
    </>
  )
}
