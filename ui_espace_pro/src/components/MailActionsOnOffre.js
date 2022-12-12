import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { cancelOffre, fillOffre } from "../api"

export default (props) => {
  const params = useParams()
  const toast = useToast()

  const redirect = (ms) => {
    setTimeout(() => {
      window.location.replace("/")
    }, 5000)
  }

  const error = () => {
    toast({
      title: "Une erreur est survenue",
      description: "Merci de vous connecter.",
      status: "error",
      position: "top",
      isClosable: false,
      duration: 5000,
    })
    redirect()
  }

  useEffect(() => {
    let { idOffre, option } = params

    if (!idOffre || !option) {
      error()
    }

    if (option === "cancel") {
      cancelOffre(idOffre)
        .then(() => {
          toast({
            title: "Offre annulée.",
            description: "L'offre a bien été mise à jour.",
            position: "top",
            status: "success",
            isClosable: true,
            duration: 5000,
          })
          redirect()
        })
        .catch((err) => error())
    }

    if (option === "provided") {
      fillOffre(idOffre)
        .then(() => {
          toast({
            title: "Offre pourvue.",
            description: "L'offre a bien été mise à jour",
            position: "top",
            status: "success",
            isClosable: true,
            duration: 5000,
          })
          redirect()
        })
        .catch(() => error())
    }
  })

  return (
    <Box>
      <Flex justify="center" align="center" h="100vh" direction="column">
        <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
        <Text>Verification en cours...</Text>
      </Flex>
    </Box>
  )
}
