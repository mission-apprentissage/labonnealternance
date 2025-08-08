import type { PropsWithChildren } from "react"

import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return <DepotSimplifieLayout>{children}</DepotSimplifieLayout>
}
