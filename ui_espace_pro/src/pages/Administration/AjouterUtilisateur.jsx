import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRef } from "react"
import * as Yup from "yup"
import { CustomInput } from "../../components"
import { ArrowRightLine, Close } from "../../theme/components/icons"

export default (props) => {
  let { isOpen, onClose, handleSave } = props
  const initialRef = useRef()
  const finalRef = useRef()

  return (
    <Formik
      enableReinitialize={true}
      initialValues={{
        nom: props.nom ?? "",
        prenom: props.prenom ?? "",
        siret: props.siret ?? "",
        raison_sociale: props.raison_sociale ?? "",
        telephone: props.telephone ?? "",
        adresse: props.adresse ?? "",
        organization: props.organization ?? "",
        scope: props.scope ?? "",
        email: props.email ?? "",
        isAdmin: props.isAdmin?.toString() ?? "false",
      }}
      validationSchema={Yup.object().shape({
        nom: Yup.string().required("Champ obligatoire"),
        prenom: Yup.string().required("Champ obligatoire"),
        siret: Yup.string()
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres"),
        raison_sociale: Yup.string(),
        telephone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
        adresse: Yup.string(),
        organization: Yup.string(),
        scope: Yup.string().required("Champs obligatoire"),
        email: Yup.string().email("Insérez un email valide").required("Champ obligatoire"),
        isAdmin: Yup.string(),
      })}
      onSubmit={async (values, { resetForm }) => {
        await handleSave(values)
        resetForm()
        onClose()
      }}
    >
      {(props) => {
        let { values, setFieldValue, handleChange, errors, touched, isValid, isSubmitting, dirty, submitForm } = props
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
                    <CustomInput name="nom" label="Nom" type="text" value={values.nom} />
                    <CustomInput name="prenom" label="Prénom" type="text" value={values.prenom} />
                  </Stack>

                  <CustomInput name="email" label="Email" type="email" value={values.email} />
                  <CustomInput name="organization" label="Organisation" type="text" value={values.organization} />
                  <CustomInput
                    name="scope"
                    label="Origine de référence"
                    type="text"
                    value={values.scope}
                    helper="Rattache une origine spécifique à l'utilisateur. [all = full access]"
                  />

                  <FormControl mt={4}>
                    <FormLabel>Administrateur</FormLabel>
                    <RadioGroup onChange={(checked) => setFieldValue("isAdmin", checked)} value={values.isAdmin}>
                      <Stack spacing={10} direction="row">
                        <Radio value={"true" || true}>Oui</Radio>
                        <Radio value={"false" || false}>Non</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>

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
                        <CustomInput name="siret" label="Siret" type="text" value={values.siret} maxLength="14" />
                        <CustomInput name="raison_sociale" label="Raison Sociale" type="text" value={values.raison_sociale} />
                        <CustomInput name="adresse" label="Adresse" type="text" value={values.adresse} />
                        <CustomInput name="telephone" label="Téléphone" type="text" value={values.telephone} maxLength="10" />
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
