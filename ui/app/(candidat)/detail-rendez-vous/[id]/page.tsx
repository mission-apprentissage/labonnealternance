import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import DetailRendezVousRendererClient from "./DetailRendezVousRendererClient"

export const metadata: Metadata = {
  title: PAGES.static.detailRendezVousApprentissage.getMetadata().title,
}

export default async function DetailRendezVousPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token: string }> }) {
  const { id } = await params
  const { token } = await searchParams

  try {
    const appointmentRecap = await apiGet("/appointment-request/context/recap", {
      querystring: { appointmentId: id },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    return <DetailRendezVousRendererClient appointmentId={id} appointment={appointmentRecap} token={token} />
  } catch {
    redirect("/404")
  }
}
