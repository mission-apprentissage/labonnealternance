import type { PropsWithChildren } from "react"
import { DetailZoneLayout } from "@/app/(candidat)/_components/DetailZoneLayout"

export default function FormationLayout({ children }: PropsWithChildren) {
  return <DetailZoneLayout zone="detail-formation">{children}</DetailZoneLayout>
}
