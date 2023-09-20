import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { cancelOffre, fillOffre } from "../api"
import { redirect } from "../common/utils/router"

export default (props) => {
  const params = useParams()
  const toast = useToast()

  const redirectFn = (ms) => {
    setTimeout(() => {
      redirect("/", true)
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
    redirectFn()
  }

  useEffect(() => {
    let { jobId, option } = params

    if (!jobId || !option) {
      error()
    }

    if (option === "cancel") {
      cancelOffre(jobId)
        .then(() => {
          toast({
            title: "Offre annulée.",
            description: "L'offre a bien été mise à jour.",
            position: "top",
            status: "success",
            isClosable: true,
            duration: 5000,
          })
          redirectFn()
        })
        .catch((err) => error())
    }

    if (option === "provided") {
      fillOffre(jobId)
        .then(() => {
          toast({
            title: "Offre pourvue.",
            description: "L'offre a bien été mise à jour",
            position: "top",
            status: "success",
            isClosable: true,
            duration: 5000,
          })
          redirectFn()
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
