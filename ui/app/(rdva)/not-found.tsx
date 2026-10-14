import type { Metadata } from "next"
import NotFound from "@/app/_components/NotFound"

export const metadata: Metadata = {
  title: "Page non trouvée - La bonne alternance",
}

// Pas de DefaultContainer : app/(rdva)/layout.tsx le pose déjà autour de ses pages.
export default function RdvaNotFound() {
  return <NotFound />
}
