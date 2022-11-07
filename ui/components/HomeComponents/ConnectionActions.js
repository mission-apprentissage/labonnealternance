import { Button, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

const ConnectionActions = ({ service }) => {
  const router = useRouter();

  return (
    <Stack direction="row" spacing="25px" pt="30px">
      {service === "entreprise" && (
        <Button
          variant="primary"
          onClick={() => router.push("/espace-pro/creation/entreprise")}
        >
          Déposer une offre
        </Button>
      )}
      {service === "cfa" && (
        <Button
          variant="primary"
          onClick={() => router.push("/espace-pro/creation/cfa")}
        >
          Créer mon espace dédié
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={() => router.push("/espace-pro/creation/cfa")}
      >
        Me connecter
      </Button>
    </Stack>
  );
};
export default ConnectionActions;
