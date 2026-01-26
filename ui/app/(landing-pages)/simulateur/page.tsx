import { SimulateurRemuneration } from "./_components/SimulateurRemuneration"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

export default async function Simulateur() {
  return (
    <div>
      <Breadcrumb pages={[PAGES.static.simulateur]} />
      <DefaultContainer>
        <SimulateurRemuneration />
      </DefaultContainer>
    </div>
  )
}
