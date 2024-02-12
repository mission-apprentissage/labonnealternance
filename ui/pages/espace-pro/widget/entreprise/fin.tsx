import { Box } from "@chakra-ui/react"

import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

import DepotRapideFin from "../../creation/fin"

export const WidgetEntrepriseMiseEnRelation = () => {
  return (
    <Box>
      <DepotRapideFin />
      <WidgetFooter />
    </Box>
  )
}

export default WidgetEntrepriseMiseEnRelation
