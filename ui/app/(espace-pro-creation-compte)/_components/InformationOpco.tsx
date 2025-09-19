import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Stack, Typography } from "@mui/material"
import Image from "next/image"

import { Edit2Fill, InfoCircle } from "@/theme/components/icons"
import { InfosOpco } from "@/theme/components/logos/infosOpcos"

export const InformationOpco = ({ isUpdatable, infosOpco, resetOpcoChoice }: { isUpdatable: boolean; resetOpcoChoice: () => void; infosOpco: InfosOpco }) => {
  return (
    <Box sx={{ backgroundColor: "#F5F5FE", p: fr.spacing("3v"), mt: fr.spacing("3v") }}>
      <Stack direction="column" gap={fr.spacing("5v")}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight="700" fontSize="20px">
            Votre OPCO
          </Typography>
          {isUpdatable && (
            <Button type="button" priority="tertiary no outline" onClick={resetOpcoChoice}>
              Modifier
              <Edit2Fill sx={{ ml: fr.spacing("2v"), width: "14px" }} />
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", flexDirection: { xs: "column", md: "row" }, gap: { xs: fr.spacing("1w"), md: fr.spacing("2w") } }}>
          <Typography>{infosOpco.description}</Typography>
          <Image src={infosOpco.image} alt="" width={80} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "2px" }}>
          <Box lineHeight={["16px", "16px", "16px", "20px"]}>
            <InfoCircle sx={{ color: "#000091", width: { xs: "14px", md: "20px" } }} />
          </Box>
          <Typography color="#000091">
            Chaque entreprise est rattachée à un OPCO. C’est votre acteur de référence pour vous accompagner dans vos démarches liées à l’alternance (financement des contrats,
            formation, ...). Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}
