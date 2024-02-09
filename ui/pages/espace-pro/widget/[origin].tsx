import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

import { AUTHTYPE } from "../../../common/contants"
import CreationCompte from "../../../components/espace_pro/Authentification/CreationCompte"

export default function Widget() {
  const router = useRouter()
  const { origin } = router.query
  return (
    <Box>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={true} origin={origin as string} />
      <WidgetFooter />
    </Box>
  )
}
