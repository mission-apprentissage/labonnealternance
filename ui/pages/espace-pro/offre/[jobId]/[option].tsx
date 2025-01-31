import { Box, Container, Flex, Image, Link, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { getDirectJobPath } from "shared/metier/lbaitemutils"

import Footer from "@/components/footer"
import Navigation from "@/components/navigation"

import { cancelOffre, fillOffre } from "../../../../utils/api"

export default function MailActionsOnOffre() {
  const router = useRouter()
  const { jobId, option, token } = router.query
  const [result, setResult] = useState("")

  const error = () => {
    setResult("Une erreur s'est produite. Merci de contacter le support de La bonne alternance")
  }

  useEffect(() => {
    if (jobId && option) {
      if (option === "cancel") {
        cancelOffre(jobId, token)
          .then(() => {
            setResult("ok")
          })
          .catch(() => error())
      }

      if (option === "provided") {
        fillOffre(jobId, token)
          .then(() => {
            setResult("ok")
          })
          .catch(() => error())
      }
    }
  }, [jobId, option])

  const cssParameters = {
    background: "#fff1e5",
    borderRadius: "10px",
    fontWeight: 700,
    margin: "10px",
    marginTop: "32px",
    padding: "5px",
  }

  return (
    <Box>
      <Navigation />
      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Box margin="auto">
          {option === "cancel" && (
            <Text as="h1" variant="homeEditorialH1">
              Annulation de l'offre déposée sur La bonne alternance
            </Text>
          )}
          {option === "provided" && (
            <Text as="h1" variant="homeEditorialH1">
              Modification de l'offre déposée sur La bonne alternance
            </Text>
          )}

          {!result && (
            <Box my={8}>
              <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
              <Text>Chargement en cours...</Text>
            </Box>
          )}
          {result && result !== "ok" && (
            <Flex alignItems="center" {...cssParameters} color="grey.650">
              <Image width="32px" mr={2} src="/images/icons/errorAlert.svg" alt="" />
              {result}
            </Flex>
          )}
          {result && result === "ok" && <Text variant="homeEditorialH2">Votre offre a été modifiée</Text>}

          <Box mt={8}>
            Aller sur le site{" "}
            <Link href="/" aria-label="Accès au site La bonne alternace" textDecoration="underline" fontWeight={700}>
              La bonne alternance
            </Link>
            <br />
            <br />
            Se connecter à votre{" "}
            <Link href="/espace-pro/authentification" aria-label="Accès à la page de connexion" textDecoration="underline" fontWeight={700}>
              espace recruteur
            </Link>
            <br />
            <br />
            {jobId && (
              <>
                Voir{" "}
                <Link href={getDirectJobPath(jobId as string)} aria-label="Visualiser l'offre en ligne" textDecoration="underline" fontWeight={700}>
                  l'offre
                </Link>{" "}
                sur le site La bonne alternance
              </>
            )}
          </Box>
        </Box>
      </Container>
      <Footer />
    </Box>
  )
}
