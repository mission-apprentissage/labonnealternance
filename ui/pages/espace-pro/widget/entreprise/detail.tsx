import { Box } from "@chakra-ui/react"

import { InformationCreationCompte } from "@/components/espace_pro/Authentification"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseDetail = () => {
  return (
    <Box>
      <InformationCreationCompte isWidget={true} />
      <WidgetFooter />
    </Box>
  )
}

export default WidgetEntrepriseDetail
