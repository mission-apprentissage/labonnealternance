"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Box, Link, Typography } from "@mui/material"
import type { FormikHelpers } from "formik"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { AnimationContainer } from ".."
import { SiretAutocomplete } from "./SiretAutocomplete"
import type { BandeauProps } from "@/app/(espace-pro)/_components/Bandeau"
import { Bandeau } from "@/app/(espace-pro)/_components/Bandeau"
import { AUTHTYPE } from "@/common/contants"
import { LogoContext } from "@/context/contextLogo"
import { WidgetContext } from "@/context/contextWidget"
import { getEntrepriseInformation, validateCfaCreation } from "@/utils/api"
import { InformationsSiret } from "@/components/espace_pro/CreationRecruteur/InformationsSiret"

import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"
import { PAGES } from "@/utils/routes.utils"
import { ApiError } from "@/utils/api.utils"
import type { searchEntreprise } from "@/services/searchEntreprises"
import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { publicConfig } from "@/config.public"

type EntrepriseOrCfaType = typeof AUTHTYPE.ENTREPRISE | typeof AUTHTYPE.CFA

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

const CreationCompteForm = ({
  organisationType,
  setBandeau,
  origin,
  isWidget,
  onSelectOrganisation,
}: {
  organisationType: EntrepriseOrCfaType
  isWidget: boolean
  origin: string
  setBandeau: (props: BandeauProps) => void
  onSelectOrganisation: (organisation: Organisation | null) => void
}) => {
  const router = useRouter()
  const [isCfa, setIsCfa] = useState(false)

  const submitSiret = ({ establishment_siret }: { establishment_siret: string }, { setSubmitting, setFieldError }: FormikHelpers<{ establishment_siret: string }>) => {
    setBandeau(null)

    const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")

    const nextUri = PAGES.dynamic.espaceProCreationDetail({ siret: formattedSiret, type: organisationType, origin, isWidget }).getPath()

    // validate establishment_siret
    if (organisationType === AUTHTYPE.ENTREPRISE) {
      getEntrepriseInformation(formattedSiret).then((entrepriseData) => {
        if (entrepriseData.error === true) {
          if (entrepriseData.statusCode >= 500) {
            router.push(nextUri)
          } else {
            setFieldError("establishment_siret", entrepriseData?.data?.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE ? BusinessErrorCodes.NON_DIFFUSIBLE : entrepriseData.message)
            setIsCfa(entrepriseData?.data?.errorCode === BusinessErrorCodes.IS_CFA)
            setSubmitting(false)
          }
        } else if (entrepriseData.error === false) {
          setSubmitting(true)
          router.push(nextUri)
        }
      })
    } else {
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
                setFieldError("establishment_siret", "Ce numéro siret est déjà associé à un compte utilisateur.")
              } else if (reason === BusinessErrorCodes.NOT_QUALIOPI) {
                setFieldError("establishment_siret", "L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi")
                setBandeau({
                  type: "error",
                  header: "Votre centre de formation n’est pas certifié Qualiopi.",
                  description: "Pour obtenir la certification, faites la démarche auprès d’un organisme certificateur : ",
                  lien: "https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs",
                })
              } else if (reason === BusinessErrorCodes.CLOSED) {
                setFieldError("establishment_siret", "Le numéro siret indique un établissement fermé.")
                setBandeau({
                  type: "error",
                  header: "Votre centre de formation est renseigné comme fermé.",
                  description: "Pour modifier les caractéristiques de votre organisme, vous pouvez vous rapprocher de l’INSEE afin de réaliser les modifications à la source.",
                })
              } else if (reason === BusinessErrorCodes.UNKNOWN) {
                setFieldError("establishment_siret", "Le numéro siret n'est pas référencé comme centre de formation.")
                setBandeau({
                  type: "error",
                  header: "Votre centre de formation n’est pas référencé dans notre catalogue.",
                  description: "Pour ajouter une offre de formation au catalogue, renseignez-vous auprès du Carif-Oref de votre région : ",
                  lien: "https://reseau.intercariforef.org/referencer-son-offre-de-formation",
                })
              } else if (reason === BusinessErrorCodes.UNSUPPORTED) {
                setFieldError("establishment_siret", "Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.")
                setBandeau({
                  type: "error",
                  header: "Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.",
                  description: (
                    <>
                      <Link
                        aria-label="Contact de l'équipe La bonne alternance par email - nouvelle fenêtre"
                        underline="hover"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`mailto:${publicConfig.publicEmail}?subject=${encodeURIComponent("Inscription d'un organisme de formation à distance")}`}
                      >
                        Contactez-nous
                      </Link>{" "}
                      pour obtenir plus d'informations.
                    </>
                  ),
                })
              }
            }
          }

          setSubmitting(false)
        })
    }
  }

  return (
    <>
      {isCfa && (
        <Alert
          severity="info"
          title={
            <Typography>
              Pour les organismes de formation,{" "}
              <Link
                onClick={() => {
                  setIsCfa(false)
                  router.push(PAGES.static.espaceProCreationCfa.getPath())
                }}
                underline="hover"
                target="_blank"
                href="#"
                rel="noopener noreferrer"
                sx={{ cursor: "pointer" }}
              >
                veuillez utiliser ce lien
              </Link>
            </Typography>
          }
        />
      )}
      <SiretAutocomplete onSubmit={submitSiret} onSelectOrganisation={onSelectOrganisation} />
    </>
  )
}

export default function CreationCompte({ type, isWidget = false, origin = "lba" }: { type: EntrepriseOrCfaType; isWidget?: boolean; origin?: string }) {
  const [organisationType, setOrganisationType] = useState<EntrepriseOrCfaType>(type)
  const { setWidget } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const [bandeau, setBandeau] = useState<BandeauProps>(null)
  const [selectedTab, setSelectedTab] = useState<EntrepriseOrCfaType>(type)
  const searchParams = useSearchParamsRecord()
  const isMobile: boolean = searchParams.mobile === "true"

  useEffect(() => {
    if (isWidget) {
      setWidget({ isWidget: true, mobile: isMobile ?? false })
      setOrganisation(origin ?? "lba")
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [])

  const onSelectOrganisation = (organisation: Organisation | null) => {
    if (organisation?.activite_principale?.startsWith("85")) {
      setOrganisationType(AUTHTYPE.CFA)
      setSelectedTab(AUTHTYPE.CFA)
    } else {
      setOrganisationType(AUTHTYPE.ENTREPRISE)
      setSelectedTab(AUTHTYPE.ENTREPRISE)
    }
  }

  return (
    <AnimationContainer>
      {bandeau && <Bandeau {...bandeau} />}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 0, md: fr.spacing("2w") }, mt: 0 }}>
        <Box
          sx={{
            mb: 4,
          }}
        >
          <Typography component="h1" sx={{ fontSize: "32px", fontWeight: 700 }}>
            Vous recrutez des alternants ?
          </Typography>
          <Typography component="div" sx={{ fontSize: "20px", lineHeight: "24px", mb: fr.spacing("2w"), mt: fr.spacing("4w") }}>
            Pour diffuser gratuitement vos offres, précisez le nom ou le SIRET de votre établissement.
          </Typography>
          <CreationCompteForm organisationType={organisationType} setBandeau={setBandeau} origin={origin} isWidget={isWidget} onSelectOrganisation={onSelectOrganisation} />
        </Box>
        <BorderedBox>
          <InformationsSiret currentTab={selectedTab} onCurrentTabChange={setSelectedTab} />
        </BorderedBox>
      </Box>
    </AnimationContainer>
  )
}
