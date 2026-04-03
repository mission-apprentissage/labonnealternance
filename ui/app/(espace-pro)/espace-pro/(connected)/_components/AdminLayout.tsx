"use client"

import NavigationAdmin from "@/app/_components/Layout/NavigationAdmin"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NavigationAdmin />
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </>
  )
}
