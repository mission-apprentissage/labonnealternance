import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { cancelOffre, fillOffre } from "../api"

export default (props) => {
  const params = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const error = () => {
    toast({
      title: "Une erreur est survenue",
      description: "Merci de vous connecter.",
      status: "error",
      position: "top",
      isClosable: false,
      duration: 5000,
    })
    navigate("/")
  }

  useEffect(() => {
    let { idOffre, option } = params

    if (!idOffre || !option) {
      error()
    }

    if (option === "cancel") {
      cancelOffre(idOffre)
        .then(() => {
          navigate("/")
          toast({
            title: "Offre annulée.",
            description: "L'offre a bien été mise à jour.",
            position: "top",
            status: "success",
            isClosable: true,
            duration: 7000,
          })
        })
        .catch((err) => {
          console.log(err.response)
          error()
        })
    }

    if (option === "provided") {
      fillOffre(idOffre)
        .then(() => {
          navigate("/")
          toast({
            title: "Offre pourvue.",
            description: "L'offre a bien été mise à jour",
            position: "top",
            status: "success",
            isClosable: true,
            duration: 7000,
          })
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
