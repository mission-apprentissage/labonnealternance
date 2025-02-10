import { Flex } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"

const ConnectionActions = ({ service }) => {
  return (
    <Flex direction={{ base: "column", md: "row" }} align="center" pt="30px">
      {service === "entreprise" && (
        <Button
          linkProps={{
            href: "/espace-pro/creation/entreprise",
          }}
          aria-label="Déposer une offre"
        >
          Déposer une offre
        </Button>
      )}
      {service === "cfa" && (
        <Button
          linkProps={{
            href: "/espace-pro/creation/cfa",
          }}
          aria-label="Créer mon espace dédié"
        >
          Créer mon espace dédié
        </Button>
      )}
      <Button
        style={fr.spacing("margin", { left: "2w", top: "2w" })} // TODO responsive margin
        linkProps={{
          href: "/espace-pro/authentification",
        }}
        aria-label="Me connecter"
        priority="secondary"
      >
        Me connecter
      </Button>
    </Flex>
  )
}
export default ConnectionActions
