import type { Metadata } from "next"
import { AUTHTYPE } from "shared/constants/recruteur"
import { getSession } from "@/utils/get-session"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { OpcoGuideView } from "./_components/OpcoGuideView"
import { fetchOpcoGuide } from "./_lib/fetch-opco-guide"

export const metadata: Metadata = {
  title: `${MODERATION_PAGES.opcoGuide.title} - La bonne alternance`,
  robots: { index: false, follow: false },
}

// Le texte du guide est à usage restreint et ce dépôt est public : il est lu dans Notion à chaque requête (#6006).
// Le proxy réserve déjà /espace-pro/opco aux OPCO ; le contrôle est refait ici avant de lire le contenu.
export default async function GuideModerationOpcoPage() {
  const { user } = await getSession()
  const result = user?.type === AUTHTYPE.OPCO ? await fetchOpcoGuide() : { status: "unavailable" as const }
  return <OpcoGuideView guide={result.status === "ok" ? result.guide : null} />
}
