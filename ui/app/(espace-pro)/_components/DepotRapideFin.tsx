"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useState } from "react"
import { ETAT_UTILISATEUR } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { zObjectId } from "shared/models/common"
import { z } from "zod"

import { useToast } from "@/app/hooks/useToast"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { MailCloud } from "@/theme/components/logos"
import { getUserStatus, getUserStatusByToken, sendValidationLink } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

const ZComponentProps = z
  .object({
    jobId: z.string(),
    email: z.string().optional(),
    withDelegation: z.enum(["true", "false"]).transform((value) => value === "true"),
    fromDashboard: z.enum(["true", "false"]).transform((value) => value === "true"),
    userId: z.union([z.string(), zObjectId]),
    token: z.string().optional(),
  })
  .strict()

type ComponentProps = z.output<typeof ZComponentProps>

export function DepotRapideFin() {
  const searchParams = useSearchParamsRecord()
  const parsedQuery = ZComponentProps.safeParse(searchParams)

  if (parsedQuery.success === false) {
    console.error(parsedQuery.error)
    throw new Error("Arguments incorrects")
  }

  return <FinComponent {...parsedQuery.data} />
}

function FinComponent(props: ComponentProps) {
  const { toast, ToastComponent } = useToast()

  const { jobId, email, withDelegation, fromDashboard, userId, token } = props

  const resendMail = () => {
    sendValidationLink(userId.toString(), token)
      .then(() => {
        toast({
          title: "Email envoyé.",
          description: "Un nouveau email vient d'être envoyé.",
          status: "success",
          duration: 4000,
        })
      })
      .catch((error) => {
        if (error.response.error) {
          switch (error.response.reason) {
            case "UNKNOWN":
              toast({
                title: "Un problème est survenu.",
                description: "L'email n'a pas pu être vérfié, merci de contacter le support.",
                status: "success",
                duration: 4000,
              })
              break
            case "VERIFIED":
              toast({
                title: "L'email est déjà vérifié.",
                description: "Vous pouvez vous connecter.",
                status: "success",
                duration: 4000,
              })
              break
            default:
              break
          }
        }
      })
  }

  /**
   * KBA 20230130 : retry set to false to avoid waiting for failure if user is from dashboard (userId is not passed)
   * - To be changed with userID in URL params
   */
  const { isFetched, data: userStatusData } = useQuery({
    queryKey: ["userdetail"],
    queryFn: () => (token ? getUserStatusByToken(userId.toString(), token) : getUserStatus(userId.toString())),
    enabled: Boolean(userId),
  })

  const userIsInError = userStatusData?.status_current === ETAT_UTILISATEUR.ERROR
  const userIsValidated = userStatusData?.status_current === ETAT_UTILISATEUR.VALIDE || fromDashboard === true

  if (!jobId && !email && !withDelegation && !fromDashboard && !userId) return <></>

  if (!isFetched && userId) {
    return <LoadingEmptySpace />
  }

  const shouldDisplayAccountInformation = !fromDashboard && !userIsInError

  return (
    <>
      {ToastComponent}
      <BorderedBox sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 1, lg: 2 }, justifyContent: "center", width: "100%", mt: 2 }}>
        <MailCloud w={["120px", "120px", "120px", "269px"]} h={["67px", "67px", "67px", "151px"]} />
        <Box>
          <Typography sx={{ backgroundColor: "white", fontSize: "32px", fontWeight: "bold", lineHeight: "32px" }} component="h1" mb={3}>
            {shouldDisplayAccountInformation ? <>Encore une étape avant la publication de votre offre...</> : <>Félicitations, votre offre est créée.</>}
          </Typography>
          {shouldDisplayAccountInformation ? (
            userIsValidated ? (
              <Box>
                <Typography component="h2" sx={{ fontSize: "18px", fontWeight: "bold" }}>
                  Confirmez votre email
                </Typography>
                <Typography>
                  {withDelegation
                    ? "Pour publier votre offre auprès des candidats et la transmettre aux organismes de formation sélectionnés, confirmez votre adresse mail en cliquant sur le lien que nous venons de vous transmettre à l’adresse suivante :"
                    : "Pour publier votre offre auprès des candidats, confirmez votre adresse mail en cliquant sur le lien que nous venons de vous transmettre à l’adresse suivante :"}{" "}
                  <GreenText>{email}</GreenText>
                </Typography>
                <ResendEmailContent onClick={resendMail} />
              </Box>
            ) : (
              <AwaitingAccountDescription withDelegation={withDelegation} email={email} onResendEmail={resendMail} />
            )
          ) : null}

          <Box mt={2}>
            <JobPreview jobId={jobId} userIsValidated={userIsValidated} />
          </Box>
        </Box>
      </BorderedBox>
    </>
  )
}

const AwaitingAccountDescription = ({ withDelegation, email, onResendEmail }: { withDelegation: boolean; email: string; onResendEmail: () => void }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, my: 1 }}>
      <Typography>Voici les prochaines étapes qui vous attendent :</Typography>
      <ContenuAvecPuce contenuPuce={1}>
        <Typography component="h2" sx={{ fontSize: "18px", fontWeight: "bold" }}>
          Confirmez votre email
        </Typography>
        <Typography>
          Cliquez sur le lien que nous venons de vous transmettre à l'adresse suivante :
          <br />
          <GreenText>{email}</GreenText>.
        </Typography>
        <ResendEmailContent onClick={onResendEmail} />
      </ContenuAvecPuce>
      <ContenuAvecPuce contenuPuce={2}>
        <Typography component="h2" sx={{ fontSize: "18px", fontWeight: "bold" }}>
          Votre compte sera validé manuellement
        </Typography>
        <Typography>
          {withDelegation
            ? "Une fois votre compte validé, vous en serez notifié par email. Votre offre sera publiée en ligne et partagée aux organismes de formation que vous avez sélectionnés."
            : "Une fois votre compte validé, vous en serez notifié par email. Votre offre sera publiée en ligne."}
        </Typography>
      </ContenuAvecPuce>
    </Box>
  )
}

const ContenuAvecPuce = ({ children, contenuPuce }: { children: React.ReactNode; contenuPuce: React.ReactNode }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "40px",
          width: "40px",
          minWidth: "40px",
          minHeight: "40px",
          borderRadius: "20px",
          backgroundColor: "#E3E3FD",
          fontSize: "20px",
          color: "#000091",
          fontWeight: "700",
        }}
      >
        {contenuPuce}
      </Box>
      <Box>{children}</Box>
    </Box>
  )
}

const ResendEmailContent = ({ onClick }: { onClick: () => void }) => {
  const [disableLink, setDisableLink] = useState(false)

  return (
    <Box mt={{ xs: 1, lg: 2 }}>
      <Box
        sx={{
          "& > *": {
            display: "inline-block",
          },
        }}
      >
        <Typography sx={{ mr: fr.spacing("4w") }}>Vous n’avez pas reçu le mail ? </Typography>
        <Button
          type="button"
          style={{
            marginLeft: "-4px",
            background: "none",
            color: "#000091",
            textDecoration: "underline",
            lineHeight: "inherit",
            width: "fit-content",
          }}
          onClick={() => {
            setDisableLink(true)
            onClick()
          }}
          disabled={disableLink}
        >
          Renvoyer le mail
        </Button>
      </Box>
    </Box>
  )
}

const JobPreview = ({ jobId, userIsValidated }: { jobId: string; userIsValidated: boolean }) => {
  return (
    <Box mb={2}>
      <Typography sx={{ mb: fr.spacing("1w") }}>
        <DsfrLink
          href={PAGES.dynamic.jobDetail({ type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId }).getPath()}
          aria-label="Ouvrir la page de prévisualisation de l'offre sur le site La bonne alternance - nouvelle fenêtre"
          external
        >
          Voir mon offre sur La bonne alternance
        </DsfrLink>
      </Typography>
      {userIsValidated && (
        <Box mb={1} mt={2}>
          <PrintJobLink jobId={jobId} />
        </Box>
      )}
      <Typography sx={{ fontSize: "16px", fontStyle: "italic", color: "grey.425" }}>
        Votre offre est également visible sur les sites internet partenaires de La bonne alternance dont : Parcoursup, “Choisir son affectation après la 3è”, le Portail de
        l’alternance, l’ONISEP, la CCI, des plateformes régionales et certains sites d’OPCO.
      </Typography>
    </Box>
  )
}

const GreenText = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontWeight: "700", backgroundColor: "#B8FEC9", color: "#18753C", padding: "2px 4px", borderRadius: "4px" }}>{children}</span>
)

function PrintJobLink({ jobId }) {
  return (
    <Box sx={{ display: "flex" }}>
      <DsfrLink
        href={PAGES.dynamic.espaceProOffreImpression(jobId).getPath()}
        aria-label="Ouvrir la page de prévisualisation de l'offre sur le site La bonne alternance - nouvelle fenêtre"
        external
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        <Typography component="span">Imprimer l'offre </Typography>
        <Image src="/images/icons/print.svg" width="24" height="24" style={{ marginTop: "4px", marginLeft: "3px", marginRight: "3px" }} aria-hidden={true} alt="" />
      </DsfrLink>
    </Box>
  )
}
