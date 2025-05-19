import type { PropsWithChildren } from "react"

import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"

export default function AccueilAdministration({ children }: PropsWithChildren) {
  return <AdminLayout currentAdminPage={"GESTION_PROCESSEURS"}>{children}</AdminLayout>
}
