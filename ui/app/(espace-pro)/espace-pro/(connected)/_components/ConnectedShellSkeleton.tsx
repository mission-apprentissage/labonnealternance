import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header"
import { DsfrHeaderProps } from "@/app/_components/Header"

// Squelette affiché pendant la résolution de la session (Suspense fallback),
// sans les éléments dépendant de l'utilisateur connecté (compte, déconnexion, navigation par rôle).
export function ConnectedShellSkeleton() {
  return <DsfrHeader {...DsfrHeaderProps} />
}
