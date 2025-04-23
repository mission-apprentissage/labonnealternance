import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function HomeLayout({ children }: { children: JSX.Element }) {
  return (
    <>
      <PublicHeader />
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
      <Footer />
    </>
  )
}
