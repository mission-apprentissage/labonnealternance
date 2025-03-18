import CompteRenderer from "@/app/(espace-pro)/espace-pro/(connected)/compte/CompteRenderer"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function Page() {
  return (
    <>
      <Breadcrumb pages={[PAGES.dynamic.backHomeEntreprise(), PAGES.dynamic.compte()]} />
      <CompteRenderer />
    </>
  )
}
