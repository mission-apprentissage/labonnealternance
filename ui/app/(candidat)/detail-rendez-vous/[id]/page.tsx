import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ApiError, apiGet } from "@/utils/api.utils"
import { METADATA } from "@/utils/routes.metadata.utils"
import DetailRendezVousRendererClient from "./DetailRendezVousRendererClient"
export const metadata: Metadata = {
  title: METADATA.static.detailRendezVousApprentissage().title,
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
  } catch (err) {
    if (err instanceof ApiError && err.isNotFoundError()) {
      notFound()
    }
    throw err
  }
}
