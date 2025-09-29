import { PropsWithChildren } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <PublicHeader />
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
      <Footer hideLinkList />
    </>
  )
}
