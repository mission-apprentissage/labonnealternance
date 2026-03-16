"use client"

import type { IAdminPage } from "@/app/_components/Layout/NavigationAdmin"
import NavigationAdmin from "@/app/_components/Layout/NavigationAdmin"

export const AdminLayout = ({ currentAdminPage, children }: { currentAdminPage: IAdminPage; children: React.ReactNode }) => {
  return (
    <>
      <NavigationAdmin currentPage={currentAdminPage} />
      <div>{children}</div>
    </>
  )
}
