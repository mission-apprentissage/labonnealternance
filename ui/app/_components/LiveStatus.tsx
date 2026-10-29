import { fr } from "@codegouvfr/react-dsfr"

type LiveStatusProps = {
  message: string
  /** "status" pour un succès ou un résultat, "alert" pour une erreur. */
  role?: "status" | "alert"
}

// Toujours monté, même vide : un lecteur d'écran ne restitue de façon fiable que le changement de
// contenu d'une zone déjà présente dans le DOM (RGAA 7.5). À placer dans le composant concerné,
// jamais dans un layout : une modale MUI pose aria-hidden sur ses nœuds frères.
export function LiveStatus({ message, role = "status" }: LiveStatusProps) {
  return (
    <div role={role} className={fr.cx("fr-sr-only")}>
      {message}
    </div>
  )
}
