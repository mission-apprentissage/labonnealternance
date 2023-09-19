import { Box, Button, Circle, Flex, Heading, Stack, Text, useToast } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useContext, useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { getUser, sendValidationLink } from "../../api"
import { AuthentificationLayout, LoadingEmptySpace } from "../../components"
import { WidgetContext } from "../../contextWidget"
import { InfoCircle } from "../../theme/components/icons"
import { MailCloud } from "../../theme/components/logos"

export function DepotRapideFin() {
  const [disableLink, setDisableLink] = useState(false)
  const [userIsValidated, setUserIsValidated] = useState()
  const [title, setTitle] = useState("")
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const client = useQueryClient()

  const { widget } = useContext(WidgetContext)
  const { job, email, withDelegation, fromDashboard, userId } = location.state

  /**
   * KBA 20230130 : retry set to false to avoid waiting for failure if user is from dashboard (userId is not passed)
   * - To be changed with userID in URL params
   */
  const { isFetched } = useQuery("userdetail", () => getUser(userId), {
    retry: false,
    onSettled: (data) => {
      const latestStatus = data?.data?.status.pop().status || false
      switch (withDelegation) {
        case true:
          if (latestStatus === "VALIDÉ" || fromDashboard) {
            setUserIsValidated(true)
            setTitle("Félicitations,<br>votre offre a bien été créée et transmise aux organismes de formation que vous avez sélectionnés.")
          } else {
            setTitle(
              "Félicitations,<br>votre offre a bien été créée.<br>Elle sera publiée et transmise aux organismes de formation que vous avez sélectionnés dès validation de votre compte."
            )
          }
          break

        case false:
          if (latestStatus === "VALIDÉ" || fromDashboard) {
            setUserIsValidated(true)
            setTitle("Félicitations,<br>votre offre a bien été créée!")
          } else {
            setTitle("Félicitations,<br>votre offre a bien été créée.<br>Elle sera publiée dès validation de votre compte.")
          }
          break

        default:
          break
      }
    },
  })

  if (!isFetched) {
    return <LoadingEmptySpace />
  }

  const resendMail = (email) => {
    sendValidationLink({ email })
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
      .finally(() => {
        setDisableLink(true)
      })
  }

  /**
   * @description On close from dahboard, return to offre-liste.
   * @return {Promise<void>}
   */
  const onClose = async () => {
    await client.invalidateQueries("offre-liste")
    navigate(-1)
  }

  const ValidatedAccountDescription = () => {
    return (
      <Box mb={5}>
        <Flex alignItems="flex-start" mb={3}>
          <InfoCircle mr={2} mt={1} />
          <Box>
            <Heading fontSize="18px" pb={2}>
              Confirmez votre email
            </Heading>
            <Text textAlign="justify">
              Afin de finaliser la diffusion de votre besoin auprès des jeunes, merci de confirmer votre adresse mail en cliquant sur le lien que nous venons de vous transmettre à
              l’adresse suivante : <span style={{ fontWeight: "700" }}>{email}</span>.
            </Text>
          </Box>
        </Flex>
        <Stack direction="row" align="center" spacing={4} mt={4} ml={6}>
          <Text mr={10}>Vous n’avez pas reçu le mail ? </Text>
          <Button variant="popover" textDecoration="underline" onClick={() => resendMail(email)} isDisabled={disableLink}>
            Renvoyer le mail
          </Button>
        </Stack>
      </Box>
    )
  }
  const AwaitingAccountDescription = () => {
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
              Afin de finaliser la diffusion de votre besoin auprès des jeunes, merci de confirmer votre adresse mail en cliquant sur le lien que nous venons de vous transmettre à
              l’adresse suivante: <span style={{ fontWeight: "700" }}>{email}</span>.
            </Text>
            <Stack direction="row" align="center" spacing={4} mt={4}>
              <Text mr={10}>Vous n’avez pas reçu le mail ? </Text>
              <Button variant="popover" textDecoration="underline" onClick={() => resendMail(email)} isDisabled={disableLink}>
                Renvoyer le mail
              </Button>
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={4}>
          <Circle p={5} size="20px" bg="#E3E3FD" color="#000091" fontWeight="700">
            2
          </Circle>
          <Box>
            <Heading fontSize="18px">Votre compte sera validé manuellement par nos équipes</Heading>
            <Text>Vous serez notifié par email une fois que ce sera fait.</Text>
          </Box>
        </Stack>
        <Stack direction="row" spacing={4}>
          <Circle p={5} size="20px" bg="#E3E3FD" color="#000091" fontWeight="700">
            3
          </Circle>
          <Box>
            <Heading fontSize="18px">Votre offre est automatiquement publiée </Heading>
            <Text>Une fois votre compte validé, votre offre est automatiquement publiée et partagée aux organismes de formation que vous avez sélectionnés.</Text>
          </Box>
        </Stack>
      </Stack>
    )
  }

  return (
    <AuthentificationLayout fromDashboard={fromDashboard} onClose={onClose}>
      <Flex direction={["column", widget?.mobile ? "column" : "row"]} align={widget?.mobile ? "center" : "flex-start"} border="1px solid #000091" mt={[4, 8]} p={[4, 8]}>
        <MailCloud style={{ paddingRight: "10px" }} />
        <Box pt={[3, 0]} ml={10}>
          <Heading fontSize="24px" mb="16px" mt={widget?.mobile ? "10px" : "0px"}>
            <div dangerouslySetInnerHTML={{ __html: title }} />
          </Heading>
          {userIsValidated ? fromDashboard ? null : <ValidatedAccountDescription /> : <AwaitingAccountDescription />}
          <Box bg="#F6F6F6" p={4}>
            <Stack direction="column" spacing="16px">
              <Heading fontSize="20px">Récapitulatif de votre besoin</Heading>
              <Text>
                Poste : <span style={{ fontWeight: "700" }}>{job.rome_appellation_label}</span>
              </Text>
              <Text>
                Niveau d'étude visé : <span style={{ fontWeight: "700" }}>{job.job_level_label}</span>
              </Text>
              <Text>
                Date de début d'apprentissage souhaitée : <span style={{ fontWeight: "700" }}>{dayjs(job.job_start_date).format("DD/MM/YYYY")}</span>
              </Text>
              <Text fontSize="14px">Votre offre expirera après 30 jours à compter de sa publication</Text>
            </Stack>
          </Box>
        </Box>
      </Flex>
    </AuthentificationLayout>
  )
}

export default DepotRapideFin
