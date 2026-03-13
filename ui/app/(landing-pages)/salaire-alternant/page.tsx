import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { SimulateurRemuneration } from "./_components/SimulateurRemuneration"

export const metadata: Metadata = {
  title: PAGES.static.salaireAlternant.getMetadata().title,
  description: PAGES.static.salaireAlternant.getMetadata().description,
}

export default async function Simulateur() {
  return (
    <div>
      <Breadcrumb pages={[PAGES.static.salaireAlternant]} />
      <DefaultContainer>
        <SimulateurRemuneration />
      </DefaultContainer>
    </div>
  )
}
