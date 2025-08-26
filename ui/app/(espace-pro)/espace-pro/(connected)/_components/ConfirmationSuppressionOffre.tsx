import { Box, Flex, Heading, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Text, useToast } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import Select from "@codegouvfr/react-dsfr/Select"
import { useQueryClient } from "@tanstack/react-query"
import { FormikProvider, useFormik } from "formik"
import { JOB_STATUS } from "shared"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/_components/CustomInput"
import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { cancelOffreFromAdmin } from "@/utils/api"

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

export interface ConfirmationSuppressionOffreProps {
  isOpen: boolean
  onClose: () => void
  offre: { _id: string }
}

export default function ConfirmationSuppressionOffre(props: ConfirmationSuppressionOffreProps) {
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
      .finally(() =>
        client.invalidateQueries({
          queryKey: ["offre-liste"],
        })
      )
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
        <ModalCloseButton onClose={onClose} />
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
              <Select
                label="Motif de la suppression (obligatoire) *"
                nativeSelectProps={{
                  onChange: (event) => formik.setFieldValue("motif", event.target.value, true),
                  name: "motif",
                  required: true,
                }}
              >
                <option disabled hidden selected value="">
                  Sélectionnez une valeur...
                </option>
                {motifs.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </Select>
              {formik.values.motif === motifAutre && <CustomInput label="Précisez votre motif (facultatif)" name="autreMotif" required={false} />}
              <Flex justifyContent="flex-end" mt={8}>
                <Box ml={3}>
                  <Button type="button" priority="secondary" onClick={() => resetState()}>
                    Annuler
                  </Button>
                </Box>
                <Box ml={3}>
                  <Button type="submit" disabled={!formik.dirty || !formik.isValid}>
                    Confirmer la suppression
                  </Button>
                </Box>
              </Flex>
            </form>
          </FormikProvider>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
