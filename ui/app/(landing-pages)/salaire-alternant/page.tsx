import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { SimulateurRemuneration } from "./_components/SimulateurRemuneration"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

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
