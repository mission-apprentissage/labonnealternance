import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Button, Circle, Heading, Image, Link, Stack, Text, useToast } from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/router"
import { useState } from "react"
import { ETAT_UTILISATEUR } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { getDirectJobPath } from "shared/metier/lbaitemutils"
import { zObjectId } from "shared/models/common"
import { z } from "zod"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { AuthentificationLayout, LoadingEmptySpace } from "../../../components/espace_pro"
import { MailCloud } from "../../../theme/components/logos"
import { getUserStatus, getUserStatusByToken, sendValidationLink } from "../../../utils/api"

const ZComponentProps = z
  .object({
    jobId: z.string(),
    email: z.string(),
    withDelegation: z.enum(["true", "false"]).transform((value) => value === "true"),
    fromDashboard: z.enum(["true", "false"]).transform((value) => value === "true"),
    userId: z.union([z.string(), zObjectId]),
    establishment_id: z.string(),
    token: z.string().optional(),
  })
  .strict()

type ComponentProps = z.output<typeof ZComponentProps>

export function DepotRapideFin() {
  const router = useRouter()

  if (!router.isReady) return

  const parsedQuery = ZComponentProps.safeParse(router.query)

  if (parsedQuery.success === false) {
    console.error(parsedQuery.error)
    throw new Error("Arguments incorrects")
  }

  return <FinComponent {...parsedQuery.data} />
}

export default function DepotRapideFinWithLayout() {
  return (
    <DepotSimplifieLayout>
      <DepotRapideFin />
    </DepotSimplifieLayout>
  )
}

function FinComponent(props: ComponentProps) {
  const router = useRouter()
  const toast = useToast()
  const client = useQueryClient()

  const { jobId, email, withDelegation, fromDashboard, userId, establishment_id, token } = props

  const resendMail = () => {
    sendValidationLink(userId.toString(), token)
      .then(() => {
        toast({
          title: "Email envoyé.",
          description: "Un nouveau email vient d'être envoyé.",
          position: "top-right",
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
                position: "top-right",
                status: "success",
                duration: 4000,
              })
              break
            case "VERIFIED":
              toast({
                title: "L'email est déjà vérifié.",
                description: "Vous pouvez vous connecter.",
                position: "top-right",
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

  /**
   * @description On close from dahboard, return to offre-liste.
   * @return {Promise<void>}
   */
  const onClose = async () => {
    await client.invalidateQueries({
      queryKey: ["offre-liste"],
    })
    await router.push(`/espace-pro/administration/entreprise/${encodeURIComponent(establishment_id.toString())}`)
  }

  const shouldDisplayAccountInformation = !fromDashboard && !userIsInError

  return (
    <AuthentificationLayout fromDashboard={fromDashboard} onClose={onClose}>
      <BorderedBox display="flex" flexDirection={["column", "column", "column", "row"]} gap={[3, 4, 4, 12]} justifyContent="center" width="100%" mt={4}>
        <MailCloud w={["120px", "120px", "120px", "269px"]} h={["67px", "67px", "67px", "151px"]} />
        <Box>
          <Heading className="big" mb={3}>
            {shouldDisplayAccountInformation ? <>Encore une étape avant la publication de votre offre...</> : <>Félicitations, votre offre est créée.</>}
          </Heading>
          {shouldDisplayAccountInformation ? (
            userIsValidated ? (
              <Box>
                <Heading fontSize="18px" lineHeight="28px">
                  Confirmez votre email
                </Heading>
                <Text>
                  {withDelegation
                    ? "Pour publier votre offre auprès des candidats et la transmettre aux organismes de formation sélectionnés, confirmez votre adresse mail en cliquant sur le lien que nous venons de vous transmettre à l’adresse suivante :"
                    : "Pour publier votre offre auprès des candidats, confirmez votre adresse mail en cliquant sur le lien que nous venons de vous transmettre à l’adresse suivante :"}{" "}
                  <GreenText>{email}</GreenText>
                </Text>
                <ResendEmailContent onClick={resendMail} />
              </Box>
            ) : (
              <AwaitingAccountDescription withDelegation={withDelegation} email={email} onResendEmail={resendMail} />
            )
          ) : null}

          <Box mt={7}>
            <JobPreview jobId={jobId} userIsValidated={userIsValidated} />
          </Box>
        </Box>
      </BorderedBox>
    </AuthentificationLayout>
  )
}

const AwaitingAccountDescription = ({ withDelegation, email, onResendEmail }: { withDelegation: boolean; email: string; onResendEmail: () => void }) => {
  return (
    <Stack spacing={4} my={4}>
      <Text>Voici les prochaines étapes qui vous attendent :</Text>
      <ContenuAvecPuce contenuPuce={1}>
        <Heading fontSize="18px">Confirmez votre email</Heading>
        <Text>
          Cliquez sur le lien que nous venons de vous transmettre à l'adresse suivante :
          <br />
          <GreenText>{email}</GreenText>.
        </Text>
        <ResendEmailContent onClick={onResendEmail} />
      </ContenuAvecPuce>
      <ContenuAvecPuce contenuPuce={2}>
        <Heading fontSize="18px">Votre compte sera validé manuellement</Heading>
        <Text>
          {withDelegation
            ? "Une fois votre compte validé, vous en serez notifié par email. Votre offre sera publiée en ligne et partagée aux organismes de formation que vous avez sélectionnés."
            : "Une fois votre compte validé, vous en serez notifié par email. Votre offre sera publiée en ligne."}
        </Text>
      </ContenuAvecPuce>
    </Stack>
  )
}

const ContenuAvecPuce = ({ children, contenuPuce }: { children: React.ReactNode; contenuPuce: React.ReactNode }) => {
  return (
    <Stack direction="row" spacing={4}>
      <Circle p={[4, 4, 4, 5]} size="20px" bg="#E3E3FD" color="#000091" fontWeight="700">
        {contenuPuce}
      </Circle>
      <Box>{children}</Box>
    </Stack>
  )
}

const ResendEmailContent = ({ onClick }: { onClick: () => void }) => {
  const [disableLink, setDisableLink] = useState(false)

  return (
    <Box mt={[4, 4, 4, 6]}>
      <Box
        sx={{
          "& > *": {
            display: "inline-block",
          },
        }}
      >
        <Text mr={8}>Vous n’avez pas reçu le mail ? </Text>
        <Button
          variant="popover"
          fontWeight={400}
          ml={-4}
          fontSize={["12px", "12px", "12px", "16px"]}
          width="fit-content"
          textDecoration="underline"
          onClick={() => {
            setDisableLink(true)
            onClick()
          }}
          isDisabled={disableLink}
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
      <Text mb={2}>
        <Link
          href={getDirectJobPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId)}
          aria-label="Ouvrir la page de prévisualisation de l'offre sur le site La bonne alternance - nouvelle fenêtre"
          isExternal
          variant="basicUnderlinedBlue"
        >
          Voir mon offre sur La bonne alternance <ExternalLinkIcon mx="2px" />
        </Link>
      </Text>
      {userIsValidated && (
        <Box mb={2}>
          <PrintJobLink jobId={jobId} />
        </Box>
      )}
      <Text fontStyle="italic" fontSize={16} color="grey.425">
        Votre offre est également visible sur les sites internet partenaires de La bonne alternance dont : Parcoursup, “Choisir son affectation après la 3è”, le Portail de
        l’alternance, l’ONISEP, la CCI, des plateformes régionales et certains sites d’OPCO.
      </Text>
    </Box>
  )
}

const GreenText = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontWeight: "700", backgroundColor: "#B8FEC9", color: "#18753C", padding: "2px 4px", borderRadius: "4px" }}>{children}</span>
)

function PrintJobLink({ jobId }) {
  return (
    <Link
      href={`/espace-pro/offre/impression/${jobId}`}
      aria-label="Ouvrir la page de prévisualisation de l'offre sur le site La bonne alternance - nouvelle fenêtre"
      isExternal
      variant="basicUnderlinedBlue"
      display="flex"
    >
      <Text as="span">Imprimer l'offre</Text> <Image src="/images/icons/print.svg" mt="4px" mx="3px" aria-hidden={true} alt="" />
    </Link>
  )
}
