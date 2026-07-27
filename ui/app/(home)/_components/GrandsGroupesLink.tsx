import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import Link from "next/link"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

export const GrandsGroupesLink = () => (
  <Box sx={{ mt: fr.spacing("6v") }}>
    <Link href={`${PAGES.static.aPropos.getPath()}#nos-partenaires`} className={fr.cx("fr-link")}>
      Voir tous les partenaires{" "}
      <ArrowRightLine sx={{ flexShrink: 0, fontSize: "12px", color: fr.colors.decisions.background.actionHigh.blueFrance.default, ml: fr.spacing("1v") }} />
    </Link>
  </Box>
)
