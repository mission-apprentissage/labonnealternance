import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user

  return (
    <>
      <Breadcrumb pages={[PAGES.dynamic.backCfaPageEntreprise(establishment_id)]} />
      <ListeOffres showStats={true} establishment_id={establishment_id} />
    </>
  )
}
