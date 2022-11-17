import { Box, Button, Flex, Heading, Link, SimpleGrid, Stack, Text, useToast } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useContext, useState } from "react"
import { useQueryClient } from "react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { sendMagiclink } from "../../api"
import { AuthentificationLayout } from "../../components"
import { WidgetContext } from "../../contextWidget"
import { InfoCircle } from "../../theme/components/icons"
import { MailCloud } from "../../theme/components/logos"

export default () => {
  const location = useLocation()
  const [disableLink, setDisableLink] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const client = useQueryClient()
  const { widget } = useContext(WidgetContext)

  const { offre, email, withDelegation, fromDashboard } = location.state

  const resendMail = (email) => {
    sendMagiclink({ email }).catch(() => {
      toast({
        title: "Email envoyé.",
        description: "Un nouveau email vient d'être envoyé.",
        position: "top-right",
        status: "success",
        duration: 5000,
      })
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

  return (
    <AuthentificationLayout fromDashboard={fromDashboard} onClose={onClose}>
      <Flex direction={["column", widget?.mobile ? "column" : "row"]} align={widget?.mobile ? "center" : "flex-start"} border="1px solid #000091" mt={[4, 8]} p={[4, 8]}>
        <MailCloud style={{ paddingRight: "10px" }} />
        <Box pt={[3, 0]} ml={10}>
          <Heading fontSize="24px" mb="16px" mt={widget?.mobile ? "10px" : "0px"}>
            {withDelegation ? (
              <>
                Félicitations, <br />
                votre offre a bien été créée, et transmise aux acteurs de l’apprentissage que vous avez sélectionnés.
              </>
            ) : (
              <>
                Félicitations, <br />
                votre offre a bien été créée!
              </>
            )}
          </Heading>
          {!fromDashboard && (
            <>
              <Flex alignItems="flex-start" mb={6}>
                <InfoCircle mr={2} mt={1} />
                <Text textAlign="justify">
                  Afin de finaliser la diffusion de votre besoin auprès des jeunes et vous connecter à votre espace de gestion,{" "}
                  <span style={{ fontWeight: "700" }}>veuillez valider votre adresse mail</span> en cliquant sur le lien que nous venons de vous transmettre à l’adresse suivante:{" "}
                  <span style={{ fontWeight: "700" }}>{email}</span>.
                </Text>
              </Flex>

              <Flex align="center" ml={5} mb="16px">
                <Text>Vous n’avez pas reçu le mail ? </Text>
                <Button as={Link} variant="classic" textDecoration="underline" onClick={() => resendMail(email)} isDisabled={disableLink}>
                  Renvoyer le mail
                </Button>
              </Flex>
            </>
          )}
          <Stack direction="column" spacing="16px" mt={fromDashboard ? 10 : 0}>
            <Heading fontSize="20px">Récapitulatif de votre besoin</Heading>
            <Text>{offre.libelle}</Text>
            <Text>{offre.niveau}</Text>
            <Text>Date de début d'apprentissage souhaitée : {dayjs(offre.date_debut_apprentissage).format("DD/MM/YYYY")}</Text>
            <Text fontSize="14px">Votre annonce sera visible pendant 30 jours, renouvelables.</Text>
          </Stack>
        </Box>
      </Flex>
    </AuthentificationLayout>
  )

  return (
    <AuthentificationLayout>
      <SimpleGrid columns={[1, 1, 1, 2]} spacing={4} mt={8}>
        <Box>
          <Heading fontSize="24px" mt={widget?.mobile ? "10px" : "0px"}>
            {withDelegation ? (
              <>
                Félicitations, <br />
                votre offre a bien été créée, et transmise aux acteurs de l’apprentissage que vous avez sélectionnés.
              </>
            ) : (
              <>
                Félicitations, <br />
                votre offre a bien été créée!
              </>
            )}
          </Heading>
          {!fromDashboard && (
            <>
              <Text textAlign="justify" mt={5}>
                Afin de finaliser la diffusion de votre besoin auprès des jeunes et vous connecter à votre espace de gestion,{" "}
                <span style={{ fontWeight: "700" }}>veuillez valider votre adresse mail</span> en cliquant sur le lien que nous venons de vous transmettre à l’adresse suivante:{" "}
                <span style={{ fontWeight: "700" }}>{email}</span>.
              </Text>

              <Flex direction={["column", "column", "column", "row"]} align="center" mt={5}>
                <Text>Vous n’avez pas reçu le mail ? </Text>
                <Button as={Link} variant="classic" textDecoration="underline" onClick={() => resendMail(email)} isDisabled={disableLink}>
                  Renvoyer le mail
                </Button>
              </Flex>
            </>
          )}
        </Box>
        <Box border="1px solid #000091" p={["4", "8"]}>
          <Stack direction="column" spacing="16px" mt={fromDashboard ? 10 : 0}>
            <Heading fontSize="20px">Récapitulatif de votre offre</Heading>
            <Text>{offre.libelle}</Text>
            <Text>{offre.niveau}</Text>
            <Text>Date de début d'apprentissage souhaitée : {dayjs(offre.date_debut_apprentissage).format("DD/MM/YYYY")}</Text>
            <Text fontSize="14px">Votre annonce sera visible pendant 30 jours, renouvelables.</Text>
          </Stack>
        </Box>
      </SimpleGrid>
    </AuthentificationLayout>
  )
}
