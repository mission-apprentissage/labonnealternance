import type { Metadata } from "next"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import NotFound from "@/app/_components/NotFound"
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
      // notFound() duplique l'en-tête/pied de page ici : le layout attend la session (getSession) dans
      // un <Suspense>, et le Suspense se remonte en double avec le HTTPAccessFallbackBoundary de Next 16.
      return (
        <DefaultContainer>
          <NotFound />
        </DefaultContainer>
      )
    }
    throw err
  }
}
