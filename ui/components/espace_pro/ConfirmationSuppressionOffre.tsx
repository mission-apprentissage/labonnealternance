import { Button, Flex, Heading, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Text, useToast } from "@chakra-ui/react"
import { FormikProvider, useFormik } from "formik"
import { useQueryClient } from "react-query"
import { JOB_STATUS } from "shared"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import { Close } from "../../theme/components/icons"
import { cancelOffreFromAdmin } from "../../utils/api"

import { CustomFormControl } from "./CustomFormControl"
import CustomInput from "./CustomInput"
import { CustomSelect } from "./CustomSelect"

const zodSchema = z.object({
  motif: z.string().nonempty(),
  autreMotif: z.string().optional(),
})

const motifsPourvus = ["J'ai pourvu l'offre avec La bonne alternance", "J'ai pourvu l'offre sans l'aide de La bonne alternance"]
const motifAutre = "Autre"
const autreMotifs = [
  "Je ne suis plus en recherche",
  "Je ne reçois pas de candidature",
  "Je n’ai pas pu personnaliser mon offre",
  "Les candidatures reçues ne sont pas assez qualifiées",
  motifAutre,
]

const motifs = [...motifsPourvus, ...autreMotifs]

export default function ConfirmationSuppressionOffre(props) {
  const toast = useToast()
  const client = useQueryClient()

  const resetState = () => {
    onClose()
  }

  const onSubmit = (values: z.output<typeof zodSchema>) => {
    const { motif, autreMotif } = values
    const estPouvue = motifsPourvus.includes(motif)
    const jobStatus = estPouvue ? JOB_STATUS.POURVUE : JOB_STATUS.ANNULEE
    const motifFinal = (motif === motifAutre ? autreMotif || motif : motif) || undefined
    cancelOffreFromAdmin(offre._id, { job_status: jobStatus, job_status_comment: motifFinal })
      .then(() => {
        toast({
          title: `Offre supprimée.`,
          description: "Votre offre a bien été mise à jour.",
          position: "top-right",
          status: "success",
          duration: 2000,
          isClosable: true,
        })
      })
      .then(() => resetState())
      .finally(() => client.invalidateQueries("offre-liste"))
  }

  const formik = useFormik({
    initialValues: {
      motif: "",
      autreMotif: "",
    },
    validationSchema: toFormikValidationSchema(zodSchema),
    enableReinitialize: true,
    onSubmit,
  })

  const { isOpen, onClose, offre } = props

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0} width="532px" minWidth={[0, 532]}>
        <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={resetState} variant="unstyled" p={6} fontWeight={400}>
          Fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <Heading as="h2" fontSize="24px" lineHeight="32px">
            Êtes-vous certain de vouloir supprimer votre offre ?
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text mb={4} color="#3A3A3A" fontSize="16px" lineHeight="24px">
            Celle-ci sera définitivement supprimée. Vous ne recevrez plus de candidatures.
          </Text>
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <CustomFormControl label="Motif de la suppression (obligatoire)" required name="motif">
                <CustomSelect
                  name="motif"
                  possibleValues={motifs}
                  value={formik.values.motif || ""}
                  selectProps={{
                    isRequired: true,
                  }}
                  onChange={(newValue) => formik.setFieldValue("motif", newValue, true)}
                />
              </CustomFormControl>
              {formik.values.motif === motifAutre && <CustomInput label="Précisez votre motif (facultatif)" name="autreMotif" required={false} />}
              <Flex justifyContent="flex-end" mt={8}>
                <Button variant="secondary" ml={3} onClick={() => resetState()}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" ml={3} isDisabled={!formik.dirty || !formik.isValid}>
                  Confirmer la suppression
                </Button>
              </Flex>
            </form>
          </FormikProvider>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
