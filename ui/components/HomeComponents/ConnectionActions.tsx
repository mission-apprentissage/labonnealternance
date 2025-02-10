import Button from "@codegouvfr/react-dsfr/Button"
import { Stack } from "@mui/material"

const ConnectionActions = ({ service }) => {
  return (
    <Stack direction={{ base: "column", md: "row" }}>
      {/* <Flex direction={{ base: "column", md: "row" }} align="center" pt="30px" gap={2} flexGrow={1}> */}
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
        linkProps={{
          href: "/espace-pro/authentification",
        }}
        aria-label="Me connecter"
        priority="secondary"
      >
        Me connecter
      </Button>
    </Stack>
  )
}
export default ConnectionActions
