import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Button, Circle, Flex, Heading, Link, Stack, Text, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext, useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { ETAT_UTILISATEUR } from "shared/constants"
import { zObjectId } from "shared/models/common"
import { z } from "zod"

import { AuthentificationLayout, LoadingEmptySpace } from "../../../components/espace_pro"
import { WidgetContext } from "../../../context/contextWidget"
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

export default function DepotRapideFin() {
  const router = useRouter()

  if (!router.isReady) return

  const parsedQuery = ZComponentProps.safeParse(router.query)

  if (parsedQuery.success === false) {
    console.error(parsedQuery.error)
    throw new Error("Arguments incorrects")
  }

  return <FinComponent {...parsedQuery.data} />
}

function FinComponent(props: ComponentProps) {
  const router = useRouter()
  const toast = useToast()
  const client = useQueryClient()
  const { widget } = useContext(WidgetContext)

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
  const { isFetched, data: userStatusData } = useQuery("userdetail", () => (token ? getUserStatusByToken(userId.toString(), token) : getUserStatus(userId.toString())), {
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
    await client.invalidateQueries("offre-liste")
    await router.push(`/espace-pro/administration/entreprise/${encodeURIComponent(establishment_id.toString())}`)
  }

  const shouldDisplayAccountInformation = !fromDashboard && !userIsInError

  return (
    <AuthentificationLayout fromDashboard={fromDashboard} onClose={onClose}>
      <Flex direction={["column", widget?.mobile ? "column" : "row"]} align={widget?.mobile ? "center" : "flex-start"} border="1px solid #000091" mt={[4, 8]} p={[4, 8]}>
        <MailCloud style={{ paddingRight: "10px" }} />
        <Box pt={[3, 0]} ml={10}>
          <Heading fontSize="24px" mb={6} mt={widget?.mobile ? "10px" : "0px"}>
            Félicitations, votre offre est créée.
          </Heading>
          <JobPreview jobId={jobId} />
          {!shouldDisplayAccountInformation ? null : userIsValidated ? (
            <ValidatedAccountDescription withDelegation={withDelegation} email={email} onResendEmail={resendMail} />
          ) : (
            <AwaitingAccountDescription withDelegation={withDelegation} email={email} onResendEmail={resendMail} />
          )}
        </Box>
      </Flex>
    </AuthentificationLayout>
  )
}

const ValidatedAccountDescription = ({ withDelegation, email, onResendEmail }: { withDelegation: boolean; email: string; onResendEmail: () => void }) => {
  return (
    <Box mb={5} mt={5}>
      <Flex alignItems="flex-start" mb={3}>
        <Box>
          <Heading fontSize="18px" pb={2}>
            Confirmez votre email
          </Heading>
          <Text textAlign="justify">
            Pour publier votre offre auprès des candidats {withDelegation ? "et la transmettre aux organismes de formation sélectionnés" : ""}, merci de confirmer votre adresse
            mail en cliquant sur le lien que nous venons de vous transmettre à l'adresse suivante:
            <br />
            <span style={{ fontWeight: "700" }}>{email}</span>
          </Text>
        </Box>
      </Flex>
      <Stack direction="row" align="center" spacing={4} mt={6}>
        <ResendEmailContent onClick={onResendEmail} />
      </Stack>
    </Box>
  )
}
const AwaitingAccountDescription = ({ withDelegation, email, onResendEmail }: { withDelegation: boolean; email: string; onResendEmail: () => void }) => {
  return (
    <Stack spacing={4} my={4}>
      <Text>Voici les prochaines étapes qui vous attendent :</Text>
      <Stack direction="row" spacing={4}>
        <Circle p={5} size="20px" bg="#E3E3FD" color="#000091" fontWeight="700">
          1
        </Circle>
        <Box>
          <Heading fontSize="18px">Confirmez votre email</Heading>
          <Text>
            Cliquez sur le lien que nous venons de vous transmettre à l'adresse suivante:
            <br />
            <span style={{ fontWeight: "700" }}>{email}</span>.
          </Text>
          <Stack direction="row" align="center" spacing={4}>
            <ResendEmailContent onClick={onResendEmail} />
          </Stack>
        </Box>
      </Stack>
      <Stack direction="row" spacing={4}>
        <Circle p={5} size="20px" bg="#E3E3FD" color="#000091" fontWeight="700">
          2
        </Circle>
        <Box>
          <Heading fontSize="18px">Votre compte sera validé manuellement</Heading>
          <Text>
            {withDelegation
              ? "Une fois votre compte validé, vous en serez notifié par email. Votre offre sera publiée en ligne et partagée aux organismes de formation que vous avez sélectionnés."
              : "Une fois votre compte validé, vous en serez notifié par email. Votre offre sera publiée en ligne."}
          </Text>
        </Box>
      </Stack>
    </Stack>
  )
}

const ResendEmailContent = ({ onClick }: { onClick: () => void }) => {
  const [disableLink, setDisableLink] = useState(false)

  return (
    <>
      <Text mr={10}>Vous n’avez pas reçu le mail ? </Text>
      <Button
        variant="popover"
        fontWeight={400}
        textDecoration="underline"
        onClick={() => {
          setDisableLink(true)
          onClick()
        }}
        isDisabled={disableLink}
      >
        Renvoyer le mail
      </Button>
    </>
  )
}

const JobPreview = ({ jobId }: { jobId: string }) => {
  return (
    <Box mb={2}>
      <Box mb={2}>
        <Link
          href={`/recherche-apprentissage?display=list&page=fiche&type=matcha&itemId=${jobId}`}
          aria-label="Ouvrir la page de prévisualisation de l'offre sur le site La bonne alternance - nouvelle fenêtre"
          isExternal
          variant="basicUnderlinedBlue"
        >
          Voir mon offre sur La bonne alternance <ExternalLinkIcon mx="2px" />
        </Link>
      </Box>
      <Text fontStyle="italic" fontSize={16} color="grey.425">
        Votre offre est également visible sur les sites internet partenaires de La bonne alternance dont : Parcoursup, “Choisir son affectation après la 3è”, le Portail de
        l’alternance, l’ONISEP, la CCI, des plateformes régionales et certains sites d’OPCO.
      </Text>
    </Box>
  )
}
