import { fr } from "@codegouvfr/react-dsfr"
import type { ReactNode } from "react"

/**
 * Tableau DSFR écrit à la main : le composant `Table` de react-dsfr ne rend que des `td` dans le `tbody`,
 * ce qui empêche de déclarer un en-tête de ligne (RGAA 5.6).
 * `captionHidden` masque visuellement le caption quand un titre visible précède immédiatement le tableau.
 */
export const TableArticle = ({
  caption,
  captionHidden = false,
  rowHeader = false,
  headers,
  data,
}: {
  caption: ReactNode
  captionHidden?: boolean
  rowHeader?: boolean
  headers: string[]
  data: ReactNode[][]
}) => (
  <div className={fr.cx("fr-table", "fr-table--layout-fixed", { "fr-table--no-caption": captionHidden })} style={{ margin: 0 }}>
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) =>
              rowHeader && j === 0 ? (
                <th key={j} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={j}>{cell}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
