import type { Metadata } from "next"
import NotFound from "@/app/_components/NotFound"

export const metadata: Metadata = {
  title: "Page non trouvée - La bonne alternance",
}

export default function EditorialNotFound() {
  return <NotFound />
}
