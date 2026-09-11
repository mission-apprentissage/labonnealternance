import type { PropsWithChildren } from "react"
import { DetailZoneLayout } from "@/app/(candidat)/_components/DetailZoneLayout"

export default function EmploiLayout({ children }: PropsWithChildren) {
  return <DetailZoneLayout zone="detail-emploi">{children}</DetailZoneLayout>
}
