import { Container } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Container maxW="full" p="0">
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Container>
  )
}
