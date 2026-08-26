type JsonLdScriptProps = {
  schema: object | object[]
  id?: string
}

/**
 * Émetteur unique de JSON-LD : centralise l'échappement pour que tous les schémas du site
 * partagent la même protection.
 */
export const JsonLdScript = ({ schema, id }: JsonLdScriptProps) => (
  <script
    type="application/ld+json"
    {...(id ? { id } : {})}
    // On échappe le caractère inférieur en séquence unicode pour qu'un libellé contenant une balise fermante de script ne puisse pas casser le script (XSS script-breakout).
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
  />
)
