import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { ReactNode } from "react"
import { DsfrIcon } from "@/components/DsfrIcon"

export const InfoSection = ({ children }: { children: ReactNode }) => (
  <Box
    gap={fr.spacing("4v")}
    display={"flex"}
    flexDirection={"row"}
    sx={{
      backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      padding: fr.spacing("2v"),
      borderRadius: fr.spacing("1v"),
      color: fr.colors.decisions.text.title.blueFrance.default,
    }}
  >
    <DsfrIcon name="fr-icon-information-fill" size={24} sx={{ margin: "auto", marginTop: "0" }} />
    {children}
  </Box>
)
