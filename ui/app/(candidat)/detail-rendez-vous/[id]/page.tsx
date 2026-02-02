import { redirect } from "next/navigation"

import type { Metadata } from "next"
import DetailRendezVousRendererClient from "./DetailRendezVousRendererClient"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.detailRendezVousApprentissage.getMetadata().title,
}

export default async function DetailRendezVousPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token: string }> }) {
  const { id } = await params
  const { token } = await searchParams
  const appointmentRecap = await apiGet("/appointment-request/context/recap", {
    querystring: { appointmentId: id },
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (!appointmentRecap) redirect("/404")

  return <DetailRendezVousRendererClient appointmentId={id} appointment={appointmentRecap} token={token} />
}
