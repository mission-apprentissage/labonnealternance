"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrIcon } from "@/components/DsfrIcon"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

const BANNER_KEY = "lba-banner-fusion-pda-dismissed"

export const BandeauFusionPDA = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(sessionStorage.getItem(BANNER_KEY) !== "true")
  }, [])

  if (!visible) return null

  const dismissBandeau = () => {
    sessionStorage.setItem(BANNER_KEY, "true")
    setVisible(false)
  }

  return (
    <Box sx={{ backgroundColor: fr.colors.decisions.background.contrast.info.default }} m={0}>
      <DefaultContainer sx={{ py: fr.spacing("4v") }}>
        <Box display={"flex"}>
          <Box>
            <Typography variant="body1" color={fr.colors.decisions.text.default.info.default} textAlign={"start"} fontWeight={"bold"}>
              <DsfrIcon name="fr-icon-info-fill" size={24} color={fr.colors.decisions.text.default.info.default} sx={{ mr: fr.spacing("2v") }} />
              La bonne alternance évolue :
            </Typography>
            <Typography variant="body1" color={fr.colors.decisions.text.default.info.default} textAlign={"start"}>
              Retrouvez notamment de{" "}
              <DsfrLink
                href={PAGES.static.guideDecouvrirLAlternance.getPath()}
                aria-label="Consulter le nouveau guide sur l'alternance"
                style={{ color: fr.colors.decisions.text.default.info.default }}
              >
                nouvelles ressources
              </DsfrLink>{" "}
              pour vous informer sur l’alternance et un{" "}
              <DsfrLink
                href={PAGES.static.salaireAlternant.getPath()}
                aria-label="Consulter le simulateur de rémunération alternant"
                style={{ color: fr.colors.decisions.text.default.info.default }}
              >
                simulateur de rémunération
              </DsfrLink>{" "}
              à destination des alternants.
            </Typography>
          </Box>
          <Button
            iconId="ri-close-line"
            size="small"
            priority="tertiary no outline"
            title="Fermer"
            aria-label="Fermer l'information sur les évolutions de la bonne alternance"
            style={{ marginLeft: "auto" }}
            onClick={dismissBandeau}
          />
        </Box>
      </DefaultContainer>
    </Box>
  )
}
