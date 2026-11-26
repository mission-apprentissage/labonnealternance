import type { Metadata } from "next"
import { connection } from "next/server"
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
  if (user?.type !== AUTHTYPE.OPCO) return <OpcoGuideView guide={null} />
  // getSession (« use cache: private ») n'arrête pas le prérendu : sans connection(), la lecture Notion y échoue
  // (Date.now() et fetch interdits) et son échec bloque les requêtes suivantes pendant le délai de reprise.
  await connection()
  const result = await fetchOpcoGuide()
  return <OpcoGuideView guide={result.status === "ok" ? result.guide : null} />
}
