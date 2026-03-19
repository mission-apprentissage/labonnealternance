import { Box, Container } from "@mui/material"
import type { PropsWithChildren } from "react"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <DefaultContainer>
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </DefaultContainer>
  )
}
