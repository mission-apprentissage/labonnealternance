import { Box, FormControl, FormErrorMessage, Text, Textarea } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"

export const CfaCandidatInformationForm = (props) => {
  const formik = props.formik

  return (
    <form onSubmit={formik.handleSubmit}>
      <Box mt={8} p={6} backgroundColor="#F5F5FE;">
        <Text as="h2" fontWeight="700" color="#000091" fontSize="22px" lineHeight="36px">
          Votre réponse au candidat
        </Text>
        <Text fontWeight="400" color="#161616" fontSize="16px" lineHeight="24px" mt="4">
          Quelle est votre réponse ?
        </Text>
        <Text fontWeight="400" color="#666666" fontSize="12px" lineHeight="20px" mt="1">
          Le candidat recevra votre réponse directement dans sa boîte mail.
        </Text>
        <FormControl isInvalid={formik.touched.message && formik.errors.message}>
          <Textarea
            id="message"
            name="message"
            my="2"
            borderRadius="4px 4px 0px 0px"
            height="200px"
            width="100%"
            onChange={formik.handleChange}
            value={formik.values.message}
            placeholder={`Bonjour,
    Merci pour l'intérêt que vous portez à notre formation. Voici les réponses aux points qui vous intéressent :
    Pour toute demande complémentaire ou pour vous inscrire, vous pouvez contacter mon collègue à l'adresse suivante`}
          />
          <FormErrorMessage>{formik.errors.message}</FormErrorMessage>
        </FormControl>
        <Box>
          <Button aria-label="Envoyer la réponse" type="submit">
            Envoyer ma réponse
          </Button>
        </Box>
        <Box mt={6}>
          <Button priority="secondary" onClick={props.otherClicked}>
            J'ai répondu au candidat par un autre canal (mail ou téléphone)
          </Button>
        </Box>
        <Box mt={2}>
          <Button priority="secondary" onClick={props.unreachableClicked}>
            Le candidat n'est pas joignable
          </Button>
        </Box>
      </Box>
    </form>
  )
}
