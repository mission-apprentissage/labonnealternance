import type { Metadata } from "next"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import NotFound from "@/app/_components/NotFound"

export const metadata: Metadata = {
  title: "Page non trouvée - La bonne alternance",
}

export default function FormationNotFound() {
  return (
    <DefaultContainer>
      <NotFound />
    </DefaultContainer>
  )
}
