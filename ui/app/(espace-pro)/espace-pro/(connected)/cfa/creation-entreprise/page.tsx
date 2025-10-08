"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SiretAutocomplete } from "@/components/espace_pro/Authentification/SiretAutocomplete"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { useAuth } from "@/context/UserContext"
import { getEntrepriseInformation } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const CreationCompte = () => {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <SiretAutocomplete
      onSubmit={({ establishment_siret }, { setSubmitting, setFieldError }) => {
        const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")
        getEntrepriseInformation(formattedSiret, { cfa_delegated_siret: user.cfa_delegated_siret }).then((entrepriseData) => {
          if (entrepriseData.error === true) {
            if (entrepriseData.statusCode >= 500) {
              router.push(PAGES.dynamic.backCfaEntrepriseCreationDetail(formattedSiret).getPath())
            } else {
              setFieldError(
                "establishment_siret",
                entrepriseData?.data?.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE ? BusinessErrorCodes.NON_DIFFUSIBLE : entrepriseData.message
              )
              setSubmitting(false)
            }
          } else if (entrepriseData.error === false) {
            setSubmitting(true)
            router.push(PAGES.dynamic.backCfaEntrepriseCreationDetail(formattedSiret).getPath())
          }
        })
      }}
    />
  )
}

const InformationSiret = () => (
  <Box sx={{ border: "1px solid #000091", p: { xs: fr.spacing("2w"), sm: fr.spacing("4w") } }}>
    <Typography sx={{ fontSize: "24px", mb: fr.spacing("3v"), fontWeight: 700, lineHeight: "30px" }} component="h2">
      Où trouver votre SIRET ?
    </Typography>
    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
      <Typography sx={{ mr: fr.spacing("1w") }} color={fr.colors.decisions.text.mention.grey.default} className={fr.cx("fr-icon-information-line")} />
      <Typography sx={{ textAlign: "justify" }}>
        Le numéro d’identification de votre entreprise partenaire peut être trouvé sur{" "}
        <DsfrLink href="https://annuaire-entreprises.data.gouv.fr/" external aria-label="Site de l'annuaire des entreprises - nouvelle fenêtre">
          l’annuaire des entreprises
        </DsfrLink>
        .
      </Typography>
    </Box>
  </Box>
)

function CreationEntreprise() {
  return (
    <DepotSimplifieStyling>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.static.backCfaCreationEntreprise]} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(2, 1fr)",
          },
          gap: { xs: 0, sm: 2, lg: 5 },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "24px", mb: fr.spacing("3v"), fontWeight: 700, lineHeight: "30px" }} component="h1">
            Renseignements entreprise
          </Typography>
          <Typography sx={{ fontSize: "20px", textAlign: "justify", mt: fr.spacing("2v") }}>
            Précisez le nom ou le SIRET de l’entreprise partenaire pour laquelle vous souhaitez diffuser des offres.
          </Typography>
          <Box mt={4}>
            <CreationCompte />
          </Box>
        </Box>
        <Box>
          <InformationSiret />
        </Box>
      </Box>
    </DepotSimplifieStyling>
  )
}

export default CreationEntreprise
