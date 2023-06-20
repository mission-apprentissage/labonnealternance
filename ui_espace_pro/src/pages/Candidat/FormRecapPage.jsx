import { useParams } from "react-router-dom"
import { Box, Flex, Link, Text } from "@chakra-ui/react"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { FormLayoutComponent } from "./layout/FormLayoutComponent"
import { useFetch } from "../../common/hooks/useFetch"
import { BarberGuy } from "../../theme/components/icons/BarberGuy"

export const FormRecapPage = () => {
  const { id: appointmentId } = useParams()
  const [data, loading] = useFetch(`/api/appointment-request/context/recap?appointmentId=${appointmentId}`)

  return (
    <FormLayoutComponent
      headerText={
        <>
          Envoyer <br />
          une demande de contact <br />
          <Text textStyle="h2" as="span" color="grey.700">
            au centre de formation
          </Text>
        </>
      }
    >
      {loading && <span>Chargement des données...</span>}
      {data && (
        <>
          {data.user && (
            <Box mt={10}>
              <Text as="span" color="info" textStyle="h6" fontWeight="700">
                Voilà une bonne chose de faite {data.user.firstname} {data.user.lastname} !
              </Text>
              <Text fontWeight="700" color="grey.750" mt={6}>
                {" "}
                {data.etablissement.etablissement_formateur_entreprise_raison_sociale} pourra donc vous contacter au{" "}
                <Text as="span" color="info">
                  {" "}
                  {data.user.phone.match(/.{1,2}/g).join(".")}
                </Text>{" "}
                ou sur
                <Text as="span" color="info">
                  {" "}
                  {data.user.email}
                </Text>{" "}
                pour répondre à vos questions.
              </Text>
              <Text mt={10}>Vous allez recevoir un email de confirmation de votre demande de contact sur votre adresse email.</Text>
              <Flex bg="#F9F8F6" mt="32px">
                <Box w="100px" px="40px" py="16px">
                  <BarberGuy w="34px" h="38px" />
                </Box>
                <Box mt="12px" pb="24px" pr="10px">
                  <Text fontSize="20px" fontWeight="700" mt="6px">
                    Psst, nous avons une{" "}
                    <Box as="span" color="#0C0CCF">
                      info pour vous !
                    </Box>
                  </Text>
                  <Text fontSize="16px" mt="12px">
                    <b>Pour préparer votre premier contact avec le centre formation,</b> répondez à notre quiz{" "}
                    <Link href="https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987" target="_blank">
                      <u>Prendre contact avec un CFA</u> <ExternalLinkIcon mt="-5px" />
                    </Link>
                  </Text>
                </Box>
              </Flex>
              <Box borderBottom="1px solid #D0C9C4" mt={10} />
              <Box mt={10}>
                {data.etablissement && (
                  <Text fontSize="14px">
                    Vous souhaitez modifier ou annuler cette demande ? <br />
                    Envoyez un email à{" "}
                    <u>
                      <a href={`mailto:${data.etablissement.email}`}>{data.etablissement.email}</a>
                    </u>
                  </Text>
                )}
              </Box>
            </Box>
          )}
        </>
      )}
    </FormLayoutComponent>
  )
}
