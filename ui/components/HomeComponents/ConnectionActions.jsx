import { Button, Flex } from "@chakra-ui/react"
import { useRouter } from "next/router"
import React from "react"

const ConnectionActions = ({ service }) => {
  const router = useRouter()

  return (
    <Flex direction={{ base: "column", md: "row" }} align="center" pt="30px">
      {service === "entreprise" && (
        <Button width="185px" variant="primary" aria-label="Déposer une offre" onClick={() => router.push({ pathname: "/espace-pro/creation/entreprise" })}>
          Déposer une offre
        </Button>
      )}
      {service === "cfa" && (
        <Button width="235px" variant="primary" aria-label="Créer mon espace dédié" onClick={() => router.push({ pathname: "/espace-pro/creation/cfa" })}>
          Créer mon espace dédié
        </Button>
      )}
      <Button
        width="155px"
        variant="secondary"
        mt={{ base: "2", md: "0" }}
        ml={{ base: "0", md: "2" }}
        aria-label="Me connecter"
        onClick={() => router.push({ pathname: "/espace-pro/authentification" })}
      >
        Me connecter
      </Button>
    </Flex>
  )
}
export default ConnectionActions
