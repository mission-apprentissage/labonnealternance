import { Button, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

const ConnectionActions = ({ service }) => {
  const router = useRouter();

  return (
    <Stack direction="row" spacing="25px" pt="30px">
      {service === "entreprise" && (
        <Button
          sx={{
            border: "1px solid #000091",
            borderRadius: 0,
            textTransform: "none",
            fontWeight: 400,
            bg: "#000091",
            color: "white",
            padding: "10px 24px",
            fontSize: "18px",
          }}
          onClick={() => router.push("/espace-pro/creation/entreprise")}
        >
          Déposer une offre
        </Button>
      )}
      {service === "cfa" && (
        <Button
          sx={{
            border: "1px solid #000091",
            borderRadius: 0,
            textTransform: "none",
            fontWeight: 400,
            bg: "#000091",
            color: "white",
            padding: "10px 24px",
            fontSize: "18px",
          }}
          onClick={() => router.push("/espace-pro/creation/cfa")}
        >
          Créer mon espace dédié
        </Button>
      )}
      <Button
        sx={{
          borderRadius: 0,
          textTransform: "none",
          fontWeight: 400,
          color: "#000091",
          bg: "white",
          border: "1px solid #000091",
          padding: "10px 24px",
          fontSize: "18px",
        }}
        onClick={() => navigate("/espace-pro/creation/cfa")}
      >
        Me connecter
      </Button>
    </Stack>
  );
};
export default ConnectionActions;
