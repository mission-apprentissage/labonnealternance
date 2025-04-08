import { Box, Text, Textarea } from "@chakra-ui/react"
import { Typography } from "@mui/material"

const CandidatureLbaMessage = ({ formik }) => {
  return (
    <>
      <Box data-testid="fieldset-message" mt={4}>
        <Typography>Votre message au responsable du recrutement (Facultatif)</Typography>
        <Text mb={2} fontSize="14px" color="grey.600">
          Indiquez pourquoi vous souhaitez réaliser votre alternance dans son établissement. <br />
          Un message personnalisé augmente vos chances d&apos;obtenir un contact avec le recruteur. <br />
          La taille du champ n&apos;est pas limitée.
        </Text>
        <Textarea
          id="message"
          data-testid="message"
          name="applicant_message"
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
          value={formik.values.applicant_message}
          borderRadius="4px 4px 0px 0px"
          height="80px"
        />
      </Box>
      {formik.touched.applicant_message && formik.errors.applicant_message ? (
        <Box fontSize="12px" color="#e10600">
          {formik.errors.applicant_message}
        </Box>
      ) : null}
    </>
  )
}

export default CandidatureLbaMessage
