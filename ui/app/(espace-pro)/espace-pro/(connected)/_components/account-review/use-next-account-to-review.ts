import { useQuery } from "@tanstack/react-query"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { getOpcoUsers } from "@/utils/api"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

type ReviewQueueItem = { _id: string; organizationId: string }

/** L'ordre est celui des listes « en attente » de l'espace admin et de l'espace OPCO, qui partagent ces clés de cache. */
export const pickNextAccount = (queue: ReviewQueueItem[], current: ReviewQueueItem) => {
  const isCurrent = (item: ReviewQueueItem) => item._id === current._id && item.organizationId === current.organizationId
  const currentIndex = queue.findIndex(isCurrent)
  const others = queue.filter((item) => !isCurrent(item))
  if (others.length === 0) return { next: null, remaining: 0 }
  const after = currentIndex === -1 ? others[0] : (queue.slice(currentIndex + 1).find((item) => !isCurrent(item)) ?? others[0])
  return { next: after, remaining: others.length }
}

export const useNextAccountToReview = ({ viewer, current }: { viewer: "ADMIN" | "OPCO"; current: ReviewQueueItem }) => {
  const adminQueue = useQuery({
    queryKey: ["/admin/users-recruteurs", ETAT_UTILISATEUR.ATTENTE],
    queryFn: () => apiGet("/admin/users-recruteurs", { querystring: { status: ETAT_UTILISATEUR.ATTENTE } }),
    enabled: viewer === "ADMIN",
  })
  const opcoQueue = useQuery({
    queryKey: ["user-list-opco"],
    queryFn: () => getOpcoUsers(),
    enabled: viewer === "OPCO",
  })

  const queue: ReviewQueueItem[] =
    viewer === "ADMIN"
      ? (adminQueue.data ?? []).map(({ _id, organizationId }) => ({ _id: _id.toString(), organizationId }))
      : (opcoQueue.data?.awaiting ?? []).map(({ _id, organizationId }) => ({ _id: _id.toString(), organizationId }))
  const isLoaded = viewer === "ADMIN" ? adminQueue.isSuccess : opcoQueue.isSuccess
  if (!isLoaded) return null

  const { next, remaining } = pickNextAccount(queue, current)
  if (!next) {
    return viewer === "ADMIN"
      ? { href: PAGES.static.backAdminHome.getPath(), label: "Retour aux comptes à vérifier" }
      : { href: PAGES.static.backOpcoHome.getPath(), label: "Retour aux entreprises à vérifier" }
  }
  const hint = `${remaining} ${remaining > 1 ? "autres" : "autre"} en attente de vérification`
  return viewer === "ADMIN"
    ? { href: `${PAGES.dynamic.backAdminRecruteurOffres({ user_id: next._id }).getPath()}?organizationId=${next.organizationId}`, label: "Compte suivant à vérifier", hint }
    : { href: PAGES.dynamic.backOpcoInformationEntreprise({ user_id: next._id }).getPath(), label: "Entreprise suivante à vérifier", hint }
}
