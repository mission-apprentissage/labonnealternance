import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { useFetch } from "../../common/hooks/useFetch";

export const KpisComponent = () => {
  const [appointmentsCount, loading] = useFetch("/api/appointment/appointments/count");
  const [parametersCount] = useFetch("/api/widget-parameters/parameters/count");

  return (
    <Box mt={6}>
      <Text textStyle="h6" fontSize="15px" fontWeight={600}>
        Chiffres clés
      </Text>
      <Flex mt={3}>
        {loading && "Chargement des données..."}
        {appointmentsCount && (
          <Box
            w={["20rem", "30rem", "30rem", "30rem", "15%"]}
            boxShadow="0 1px 2px 0 rgb(0 0 0 / 5%)"
            border="1px solid rgba(0,40,100,.12)"
            borderRadius="3px"
            textAlign="center"
            p={3}
            bg="white"
          >
            <Text textStyle="h3">{appointmentsCount.total}</Text>
            <Text fontWeight="400" mb={4}>
              {appointmentsCount.total >= 0 ? "Demandes de RDV" : "Demande de RDV"}{" "}
            </Text>
          </Box>
        )}
        {parametersCount && (
          <Box
            ml={[10]}
            mt={[0]}
            w={["20rem", "30rem", "30rem", "30rem", "15%"]}
            boxShadow="0 1px 2px 0 rgb(0 0 0 / 5%)"
            border="1px solid rgba(0,40,100,.12)"
            borderRadius="3px"
            textAlign="center"
            p={3}
            bg="white"
          >
            <Text textStyle="h3">{parametersCount.total}</Text>
            <Text fontWeight="400" mb={4}>
              {parametersCount.total >= 0 ? "Paramétrages" : "Paramétrage"}
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
};
