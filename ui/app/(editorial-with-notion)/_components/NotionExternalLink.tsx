import type { AnchorHTMLAttributes } from "react"

/**
 * Liens externes du contenu Notion.
 *
 * Le composant `Link` par défaut de react-notion-x rend `<a target="_blank" rel="noopener noreferrer">`
 * sans annoncer le changement de contexte : le nom accessible se limite au texte rédigé dans Notion.
 * On le remplace pour ajouter la mention, comme le fait DsfrLink dans le reste du site (RGAA 6.1).
 */
export function NotionExternalLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="fr-sr-only"> - nouvelle fenêtre</span>
    </a>
  )
}
