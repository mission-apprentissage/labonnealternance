import { PropsWithChildren } from "react"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <PublicHeader />
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
      <Footer />
    </>
  )
}
