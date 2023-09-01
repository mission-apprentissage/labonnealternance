import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRef } from "react"
import * as Yup from "yup"
import { CustomInput } from "../../components"
import { ArrowRightLine, Close } from "../../theme/components/icons"

const AjouterUtilisateur = (props) => {
  let { isOpen, onClose, handleSave } = props
  const initialRef = useRef()
  const finalRef = useRef()

  return (
    <Formik
      enableReinitialize={true}
      initialValues={{
        last_name: props.last_name ?? "",
        first_name: props.first_name ?? "",
        establishment_siret: props.establishment_siret ?? "",
        establishment_raison_sociale: props.establishment_raison_sociale ?? "",
        phone: props.phone ?? "",
        address: props.address ?? "",
        scope: props.scope ?? "",
        email: props.email ?? "",
      }}
      validationSchema={Yup.object().shape({
        last_name: Yup.string().required("Champ obligatoire"),
        first_name: Yup.string().required("Champ obligatoire"),
        establishment_siret: Yup.string()
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres"),
        establishment_raison_sociale: Yup.string(),
        phone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
        address: Yup.string(),
        scope: Yup.string().required("Champs obligatoire"),
        email: Yup.string().email("Insérez un email valide").required("Champ obligatoire"),
      })}
      onSubmit={async (values, { resetForm }) => {
        await handleSave(values)
        resetForm()
        onClose()
      }}
    >
      {(props) => {
        let { values, isValid, isSubmitting, dirty, submitForm } = props
        return (
          <Form>
            <Modal closeOnOverlayClick={false} blockScrollOnMount={true} initialFocusRef={initialRef} finalFocusRef={finalRef} isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
                <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
                  fermer
                  <Text as={"span"} ml={2}>
                    <Close boxSize={4} />
                  </Text>
                </Button>

                <ModalHeader>
                  <Heading as="h2" fontSize="1.5rem">
                    <Flex>
                      <Text as={"span"}>
                        <ArrowRightLine boxSize={26} />
                      </Text>
                      <Text as={"span"} ml={4}>
                        Ajouter un utilisateur
                      </Text>
                    </Flex>
                  </Heading>
                </ModalHeader>
                <ModalBody pb={6}>
                  <Stack direction="row">
                    <CustomInput name="last_name" label="Nom" type="text" value={values.last_name} />
                    <CustomInput name="first_name" label="Prénom" type="text" value={values.first_name} />
                  </Stack>

                  <CustomInput name="email" label="Email" type="email" value={values.email} />
                  <CustomInput
                    name="scope"
                    label="Origine de référence"
                    type="text"
                    value={values.scope}
                    helper="Rattache une origine spécifique à l'utilisateur. [all = full access]"
                  />

                  <Accordion allowToggle my={5}>
                    <AccordionItem>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            Renseignements Entreprise
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <CustomInput name="establishment_siret" label="Siret" type="text" value={values.establishment_siret} maxLength="14" />
                        <CustomInput name="establishment_raison_sociale" label="Raison Sociale" type="text" value={values.establishment_raison_sociale} />
                        <CustomInput name="address" label="Adresse" type="text" value={values.address} />
                        <CustomInput name="phone" label="Téléphone" type="text" value={values.phone} maxLength="10" />
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </ModalBody>

                <ModalFooter>
                  <Button variant="form" isFullWidth={true} disabled={!(isValid && dirty) || isSubmitting} onClick={submitForm}>
                    Enregistrer
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Form>
        )
      }}
    </Formik>
  )
}

export default AjouterUtilisateur
