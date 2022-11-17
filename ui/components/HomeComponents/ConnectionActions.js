import { Button, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

const ConnectionActions = ({ service }) => {
  const router = useRouter();

  return (
    <Stack direction="row" spacing={{base: 1, sm: 2, md: 8}} pt="30px">
      {service === "entreprise" && (
        <Button
          variant="primary"
          aria-label="Déposer une offre"
          onClick={() => router.push("/espace-pro/creation/entreprise")}
        >
          Déposer une offre
        </Button>
      )}
      {service === "cfa" && (
        <Button
          variant="primary"
          aria-label="Créer mon espace dédié"  
          onClick={() => router.push("/espace-pro/creation/cfa")}
        >
          Créer mon espace dédié
        </Button>
      )}
      <Button
        variant="secondary"
        aria-label="Me connecter"
        onClick={() => router.push("/espace-pro/creation/cfa")}
      >
        Me connecter
      </Button>
    </Stack>
  );
};
export default ConnectionActions;
