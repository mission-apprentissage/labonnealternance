"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { AUTHTYPE } from "shared/constants/recruteur"
import Social from "@/app/(1jeune1solution)/components/Social"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SiretAutocomplete, type SiretSubmitHelpers } from "@/components/espace_pro/Authentification/SiretAutocomplete"
import type { searchEntreprise } from "@/services/search-entreprises"
import { getEntrepriseInformation, validateCfaCreation } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

const utmParams = "utm_source=lba&utm_medium=website&utm_campaign=recruteurs_landinglba1j1s"
const statValueSx = { color: fr.colors.decisions.text.title.blueFrance.default, fontWeight: 800, fontSize: "56px", lineHeight: "64px", mt: fr.spacing("6v"), mb: fr.spacing("1v") }
const statLabelSx = { color: fr.colors.decisions.text.title.grey.default, fontWeight: 800, fontSize: "28px", lineHeight: "36px", mb: fr.spacing("3v") }

export const CreationCompteForm = ({ origin, onSelectOrganisation }: { origin: string; onSelectOrganisation: (organisation: Organisation | null) => void }) => {
  const router = useRouter()

  const submitSiret = ({ establishment_siret }: { establishment_siret: string }, { setSubmitting, setSiretError }: SiretSubmitHelpers) => {
    const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")

    let nextUri = PAGES.dynamic.espaceProCreationDetail({ siret: formattedSiret, type: AUTHTYPE.ENTREPRISE, origin, isWidget: false }).getPath()

    getEntrepriseInformation(formattedSiret).then((entrepriseData) => {
      setSubmitting(true)
      if (entrepriseData.error === true) {
        if (entrepriseData.statusCode >= 500) {
          router.push(nextUri)
        } else {
          if (entrepriseData?.data?.errorCode === BusinessErrorCodes.IS_CFA) {
            nextUri = PAGES.dynamic.espaceProCreationDetail({ siret: formattedSiret, type: AUTHTYPE.CFA, origin, isWidget: false }).getPath()
            validateCfaCreation(formattedSiret)
              .then(() => {
                setSubmitting(false)
                router.push(nextUri)
              })
              .catch((error) => {
                if (error instanceof ApiError) {
                  const { statusCode, errorData } = error.context
                  if (statusCode >= 400 && statusCode < 500) {
                    const { reason } = errorData
                    if (reason === BusinessErrorCodes.ALREADY_EXISTS) {
                      setSiretError("Ce numéro siret est déjà associé à un compte utilisateur.")
                    } else if (reason === BusinessErrorCodes.NOT_QUALIOPI) {
                      setSiretError("L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi")
                    } else if (reason === BusinessErrorCodes.CLOSED) {
                      setSiretError("Le numéro siret indique un établissement fermé.")
                    } else if (reason === BusinessErrorCodes.UNKNOWN) {
                      setSiretError("Le numéro siret n'est pas référencé comme centre de formation.")
                    } else if (reason === BusinessErrorCodes.UNSUPPORTED) {
                      setSiretError("Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.")
                    }
                  }
                }

                setSubmitting(false)
              })
          } else {
            setSiretError(entrepriseData?.data?.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE ? BusinessErrorCodes.NON_DIFFUSIBLE : entrepriseData.message)
            setSubmitting(false)
          }
        }
      } else if (entrepriseData.error === false) {
        setSubmitting(false)
        router.push(nextUri)
      }
    })
  }

  return <SiretAutocomplete onSubmit={submitSiret} onSelectOrganisation={onSelectOrganisation} />
}

export default function UnJeune1Solution() {
  const onSelectOrganisation = (organisation: Organisation | null) => {
    // Sans effet : le type de compte (CFA ou entreprise) est déterminé à la soumission (cf. submitSiret).
  }

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("8v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
    >
      <Box sx={{ px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 } }}>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "start" }}>
            <Box>
              <Typography component={"h1"} sx={{ fontSize: "56px", fontWeight: 800, lineHeight: "64px" }}>
                À chacun
                <br />
                <Box component="span" sx={{ color: "#000091" }}>
                  sa solution
                </Box>
              </Typography>
              <Typography sx={{ fontSize: "20px", mt: fr.spacing("6v") }}>Trouvez votre future recrue avec 1jeune1solution et La bonne alternance.</Typography>
              <Typography component={"h2"} sx={{ fontSize: { xs: "28px", md: "32px" }, fontWeight: 800, lineHeight: { xs: "36px", md: "40px" }, mt: fr.spacing("6v") }}>
                Publier une offre en alternance
              </Typography>
              <Typography sx={{ fontSize: "20px", mt: fr.spacing("6v"), mb: fr.spacing("2v") }}>Pour démarrer, recherchez le nom ou le SIRET de votre entreprise :</Typography>
              <CreationCompteForm origin="1jeune1solution" onSelectOrganisation={onSelectOrganisation} />
            </Box>
          </Box>
          <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1, alignSelf: "center", "& > img": { display: "block", maxWidth: "100%", height: "auto" } }}>
            <NextImage src="/images/1j1s/personna.webp" alt="" aria-hidden="true" width={626} height={347} unoptimized />
          </Box>
        </Box>
      </Box>

      {/* Fond pleine largeur sans sortir du Container : l'ombre étend la couleur, clip-path la limite à l'axe horizontal. */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: fr.spacing("6v"),
          px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 },
          py: fr.spacing("8v"),
          background: "#A9FB68",
          boxShadow: "0 0 0 100vmax #A9FB68",
          clipPath: "inset(0 -100vmax)",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/france.webp" width={80} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />

          <Typography sx={statValueSx}>3,5 M</Typography>
          <Typography sx={statLabelSx}>de visiteurs</Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>Sur La bonne alternance en 2025</Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/enveloppe.webp" width={80} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography sx={statValueSx}>200 000</Typography>
          <Typography sx={statLabelSx}>candidats</Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>postulent aux offres chaque année</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/mains.webp" width={80} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography sx={statValueSx}>30%</Typography>
          <Typography sx={statLabelSx}>1 apprenti sur 3</Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>reste dans l'entreprise qui l'a formé</Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 } }}>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, minWidth: 0, "& > img": { display: "block", width: "100%", maxWidth: "622px", height: "auto" } }}>
            <NextImage src="/images/1j1s/job-post.webp" alt="" aria-hidden="true" width={622} height={385} unoptimized />
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ color: fr.colors.decisions.text.title.blueFrance.default, fontSize: "28px", fontWeight: 800, lineHeight: "36px" }}>
                Postez votre offre d’alternance en quelques secondes
              </Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("4v") }}>Sélectionnez le métier sur lequel vous recrutez, nous générons votre offre instantanément.</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ color: fr.colors.decisions.text.title.blueFrance.default, fontSize: "28px", fontWeight: 800, lineHeight: "36px" }}>
                Nous la diffusons gratuitement au plus près des candidats
              </Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("4v") }}>
                Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
                <DsfrLink href={PAGES.static.home.getPath()}>La bonne alternance</DsfrLink>, <DsfrLink href="https://www.francetravail.fr/accueil/">France Travail</DsfrLink>,{" "}
                <DsfrLink href="https://parcoursup.fr">Parcoursup</DsfrLink>, <DsfrLink href="https://www.hellowork.com">HelloWork</DsfrLink> et{" "}
                <DsfrLink href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1">
                  bien d'autres
                  <span className="fr-sr-only">{" - Consulter les autres partenaires de La bonne alternance"}</span>
                </DsfrLink>
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, "& > img": { display: "block", width: "100%", maxWidth: "697px", height: "auto" } }}>
            <NextImage src="/images/1j1s/partner.webp" alt="" aria-hidden="true" width={697} height={417} unoptimized />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, minWidth: 0, "& > img": { display: "block", width: "100%", maxWidth: "519px", height: "auto" } }}>
            <NextImage src="/images/1j1s/sourcing.webp" alt="" aria-hidden="true" width={519} height={441} unoptimized />
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ color: fr.colors.decisions.text.title.blueFrance.default, fontSize: "28px", fontWeight: 800, lineHeight: "36px" }}>
                Recevez les profils des candidats dans votre boite mail
              </Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("4v") }}>
                Les candidats vous partagent leurs coordonnées et leur CV directement par email, à vous de répondre !
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Social utmParams={utmParams} />
    </Container>
  )
}
