import { Box, Button, Flex, Heading, SimpleGrid, Text, useBoolean, useDisclosure } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import * as Yup from "yup"
import { createPartenaire } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import {
  AnimationContainer,
  AuthentificationLayout,
  ConfirmationCreationCompte,
  CustomInput,
  InformationLegaleEntreprise,
  InformationOpco,
  SelectionManuelleOcpo,
} from "../../components"
import { WidgetContext } from "../../contextWidget"
import { ArrowRightLine } from "../../theme/components/icons"
import logosOpco from "../../theme/components/logos/logosOpco"

const Formulaire = ({ submitForm, validateOpcoChoice }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { widget } = useContext(WidgetContext)

  const { raison_sociale, adresse, email, contacts, siret, geo_coordonnees, opco, idcc, code_naf, libelle_naf, tranche_effectif, date_creation_etablissement } =
    location.state?.informationSiret
  const { type, origine } = location.state

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        siret: siret,
        raison_sociale: raison_sociale,
        adresse: adresse,
        contacts: contacts,
        geo_coordonnees: geo_coordonnees,
        opco: opco,
        idcc: idcc,
        type: type,
        code_naf: code_naf,
        libelle_naf: libelle_naf,
        tranche_effectif: tranche_effectif,
        date_creation_etablissement: date_creation_etablissement,
        origine: origine ?? "matcha",
        nom: undefined,
        prenom: undefined,
        telephone: undefined,
        email: email ? email : undefined,
      }}
      validationSchema={Yup.object().shape({
        raison_sociale: Yup.string().required("champs obligatoire"),
        siret: Yup.string()
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres")
          .required("champs obligatoire"),
        adresse: Yup.string().required("champ obligatoire"),
        email: Yup.string().email("Insérez un email valide").lowercase().required("champ obligatoire"),
        nom: Yup.string().required("champ obligatoire"),
        prenom: Yup.string().required("champ obligatoire"),
        telephone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
      })}
      onSubmit={submitForm}
    >
      {({ values, isValid, isSubmitting }) => {
        return (
          <Form>
            <CustomInput required={false} name="nom" label="Nom" type="text" value={values.nom} />
            <CustomInput required={false} name="prenom" label="Prénom" type="text" value={values.prenom} />
            <CustomInput
              required={false}
              name="telephone"
              label="Numéro de téléphone"
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              helper={
                type === AUTHTYPE.ENTREPRISE
                  ? "Le numéro de téléphone sera visible sur l'offre d'emploi"
                  : "Le numéro de téléphone sera visible sur l’offre d’emploi de vos entreprises partenaires"
              }
              value={values.telephone}
            />
            <CustomInput
              sx={{ textTransform: "lowercase" }}
              required={false}
              isDisabled={email ? true : false}
              name="email"
              label="Email"
              type="email"
              value={values.email}
              info={
                email
                  ? "L’email que nous utilisons est fourni par votre Carif Oref, et permet de vous connecter. Vous pourrez le modifier dans votre espace personnel."
                  : "Il s’agit de l’adresse qui vous permettra de vous connecter à votre compte. Privilégiez votre adresse professionnelle"
              }
            />
            <Flex justifyContent="flex-end" alignItems="center" mt={5}>
              {!widget?.isWidget && (
                <Button variant="link" sx={{ color: "black", fontWeight: 400 }} mr={5} onClick={() => navigate("/", { replace: true })}>
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                variant="form"
                leftIcon={<ArrowRightLine width={5} />}
                isActive={isValid && values.opco === undefined && type === "ENTREPRISE" ? validateOpcoChoice : isValid}
                isDisabled={!isValid || isSubmitting || (values.opco === undefined && type === "ENTREPRISE") ? !validateOpcoChoice : null}
              >
                Suivant
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

export default () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { type } = location.state
  const { widget } = useContext(WidgetContext)
  const validationPopup = useDisclosure()
  const [userData, setUserData] = useState()
  const [opcoChoice, setOpcoChoice] = useState()
  const [validateOpcoChoice, setValidateOpcoChoice] = useBoolean()
  const [informationOpco, setInformationOpco] = useState()

  const informationEntreprise = { ...location.state?.informationSiret, type: location.state?.type }

  useEffect(() => {
    if (location.state?.informationSiret.opco !== undefined) {
      setOpcoChoice(location.state?.informationSiret.opco)
      setValidateOpcoChoice.toggle()
    }
  }, [])

  useEffect(() => {
    const [informations] = logosOpco.filter((x) => x.nom === opcoChoice)
    setInformationOpco(informations)
  }, [validateOpcoChoice])

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    if (opcoChoice !== undefined) {
      values = { ...values, opco: opcoChoice }
    }
    // save info if not trusted from source
    createPartenaire(values)
      .then(({ data }) => {
        if (data.user.etat_utilisateur[0].statut === "EN ATTENTE DE VALIDATION") {
          validationPopup.onOpen()
          setUserData(data)
        } else {
          if (data.user.type === AUTHTYPE.ENTREPRISE) {
            // Dépot simplifié
            navigate("/creation/offre", {
              replace: true,
              state: { id_form: data.formulaire.id_form, email: data.user.email },
            })
          } else {
            navigate("/authentification/confirmation", { replace: true, state: { email: data.email } })
          }
        }

        setSubmitting(false)
      })
      .catch((error) => {
        console.log(error)
        setFieldError("email", error.response.data.message)
        setSubmitting(false)
      })
  }

  const resetOpcoChoice = () => {
    setOpcoChoice()
    setValidateOpcoChoice.off()
    setInformationOpco()
  }

  return (
    <AnimationContainer>
      <ConfirmationCreationCompte {...userData} {...validationPopup} validateManualOpco={validateOpcoChoice} />
      <AuthentificationLayout>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={["35px", "35px", "35px", "75px"]} mt={widget.isWidget ? 0 : 12}>
          <Box>
            {widget.isWidget && (
              <Text textTransform="uppercase" fontSize="20px" color="#666666">
                Dépot simplifié d'offre en alternance
              </Text>
            )}
            <Heading>{type === AUTHTYPE.ENTREPRISE ? "Vos informations de contact" : "Créez votre compte"}</Heading>
            <Box fontSize="20px" mb={4}>
              <Text textAlign="justify" mt={2}>
                {type === AUTHTYPE.ENTREPRISE
                  ? "Les informations de contact seront visibles sur vos offres et permettront de recevoir les candidatures."
                  : "Les informations de contact seront visibles sur les offres de vos entreprises partenaires"}
              </Text>
              <Text>Elles peuvent être modifiées ultérieurement.</Text>
            </Box>
            <Box>
              <Formulaire validateOpcoChoice={validateOpcoChoice} submitForm={submitForm} />
            </Box>
          </Box>
          <Box>
            {location.state?.informationSiret?.opco === undefined && !validateOpcoChoice && type === "ENTREPRISE" && (
              <SelectionManuelleOcpo opcoChoice={opcoChoice} setOpcoChoice={setOpcoChoice} setValidateOpcoChoice={setValidateOpcoChoice} />
            )}
            {informationOpco && <InformationOpco disabled={location.state?.informationSiret.opco} informationOpco={informationOpco} resetOpcoChoice={resetOpcoChoice} />}
            <InformationLegaleEntreprise {...informationEntreprise} />
          </Box>
        </SimpleGrid>
      </AuthentificationLayout>
    </AnimationContainer>
  )
}
