import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { getConnectedSessionUser } from "@/utils/sessionUtils"

export default async function Page() {
  const {
    user: { establishment_id },
  } = await getConnectedSessionUser()

  return (
    <>
      <Breadcrumb pages={[PAGES.dynamic.backCfaPageEntreprise(establishment_id)]} />
      <ListeOffres showStats={true} establishment_id={establishment_id} />
    </>
  )
}
