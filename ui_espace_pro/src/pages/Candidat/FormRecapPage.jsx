import { useParams } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { FormLayoutComponent } from "./layout/FormLayoutComponent";
import { useFetch } from "../../common/hooks/useFetch";

export const FormRecapPage = () => {
  const { id: appointmentId } = useParams();
  const [data, loading] = useFetch(`/api/appointment-request/context/recap?appointmentId=${appointmentId}`);

  return (
    <FormLayoutComponent
      headerText={
        <>
          Envoyer <br />
          une demande de contact <br />
          <Text textStyle="h2" as="span" color="grey.700">
            au centre de formation
          </Text>
        </>
      }
    >
      {loading && <span>Chargement des données...</span>}
      {data && (
        <>
          {data.user && (
            <Box mt={10}>
              <Text as="span" color="info" textStyle="h6">
                Voilà une bonne chose de faite {data.user.firstname} {data.user.lastname} !
              </Text>
              <Text fontWeight="700" color="grey.750" mt={6}>
                {" "}
                {data.etablissement.etablissement_formateur_entreprise_raison_sociale} pourra donc vous contacter au{" "}
                <Text as="span" color="info">
                  {" "}
                  {data.user.phone.match(/.{1,2}/g).join(".")}
                </Text>{" "}
                ou sur
                <Text as="span" color="info">
                  {" "}
                  {data.user.email}
                </Text>{" "}
                pour répondre à vos questions.
              </Text>
              <Text mt={10}>
                Vous allez recevoir un email de confirmation de votre demande de contact sur votre adresse email.
              </Text>
              <Box borderBottom="1px solid #D0C9C4" mt={10} />
              <Box mt={10}>
                {data.etablissement && (
                  <Text fontSize="14px">
                    Vous souhaitez modifier ou annuler cette demande ? <br />
                    Envoyez un email à{" "}
                    <u>
                      <a href={`mailto:${data.etablissement.email}`}>{data.etablissement.email}</a>
                    </u>
                  </Text>
                )}
              </Box>
            </Box>
          )}
        </>
      )}
    </FormLayoutComponent>
  );
};
