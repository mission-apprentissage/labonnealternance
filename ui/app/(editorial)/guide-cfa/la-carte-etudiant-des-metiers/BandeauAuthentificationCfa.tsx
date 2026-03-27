"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useState } from "react"
import { DsfrIcon } from "@/components/DsfrIcon"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const BandeauAuthentificationCfa = () => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <Box display="flex" gap={fr.spacing("2v")} mb={fr.spacing("4v")} border={`1px solid ${fr.colors.decisions.border.default.blueFrance.default}`} flexDirection="row">
      <Box display="flex" flexDirection="column" bgcolor={fr.colors.decisions.background.actionHigh.info.default} p={fr.spacing("2v")}>
        <DsfrIcon name="fr-icon-info-fill" size={19} style={{ color: fr.colors.decisions.text.inverted.grey.default, marginLeft: "auto", marginRight: "auto" }} />
      </Box>
      <Box p={fr.spacing("3v")} display="flex" flexDirection="column" gap={fr.spacing("2v")} flex={1}>
        <Typography component="p" variant="h6">
          Vous aviez déjà un compte CFA sur le Portail de l'alternance ?
        </Typography>
        <Typography component="span" variant="body1">
          Pour les organismes de formation qui avaient déjà un compte sur le Portail de l'alternance, vous devez créer un nouveau compte CFA sur La bonne alternance pour continuer
          d'accéder à la carte d'étudiant des métiers.{" "}
          <DsfrLink href={PAGES.static.authentification.getPath()} aria-label="Accéder à la page d'authentification">
            Créer mon compte
          </DsfrLink>
        </Typography>
      </Box>
      <Box>
        <Button
          iconId="fr-icon-close-line"
          size="small"
          priority="tertiary no outline"
          title="Fermer"
          aria-label="Fermer l'information sur la création de compte CFA"
          onClick={() => setVisible(false)}
        />
      </Box>
    </Box>
  )
}
