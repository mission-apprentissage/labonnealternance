import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { redirect } from "../../../../common/utils/router"
import { cancelOffre, fillOffre } from "../../../../utils/api"

export default function MailActionsOnOffre() {
  const router = useRouter()
  let { jobId, option } = router.query
  const toast = useToast()

  const redirectFn = () => {
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
        .catch(() => error())
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
