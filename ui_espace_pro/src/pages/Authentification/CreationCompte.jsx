import { Alert, AlertIcon, Box, Button, Flex, Heading, Link, ListItem, SimpleGrid, Stack, Text, UnorderedList } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import * as Yup from "yup"
import { getCfaInformation, getEntrepriseInformation } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import { AnimationContainer, AuthentificationLayout, CustomInput, InformationLegaleEntreprise } from "../../components"
import { LogoContext } from "../../contextLogo"
import { WidgetContext } from "../../contextWidget"
import { InfoCircle, SearchLine } from "../../theme/components/icons"

const CreationCompte = ({ type, setQualiopi, setBandeau, setStatus }) => {
  const [isCfa, setIsCfa] = useState(false)
  const navigate = useNavigate()
  const { origine } = useParams()

  const submitSiret = ({ siret }, { setSubmitting, setFieldError }) => {
    setBandeau(false)
    // validate SIRET
    if (type === AUTHTYPE.ENTREPRISE) {
      getEntrepriseInformation(siret)
        .then(({ data }) => {
          setSubmitting(true)
          navigate("/creation/detail", { state: { informationSiret: data, type, origine } })
        })
        .catch(({ response }) => {
          setFieldError("siret", response.data.message)
          setIsCfa(response.data?.isCfa)
          setSubmitting(false)
        })
    } else {
      getCfaInformation(siret)
        .then(({ data }) => {
          setSubmitting(false)
          navigate("/creation/detail", { state: { informationSiret: data, type, origine } })
        })
        .catch(({ response }) => {
          if (response.data.error) {
            if (response.data.reason === "EXIST") {
              setFieldError("siret", "Ce numéro siret est déjà associé à un compte utilisateur.")
            }
            if (response.data.reason === "QUALIOPI") {
              setFieldError("siret", "L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi")
              setQualiopi(response.data.data)
              setBandeau({
                header: "Votre centre de formation n’est pas certifié Qualiopi.",
                description: "Pour obtenir la certification, faites la démarche auprès d’un organisme certificateur : ",
                lien: "https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs",
              })
            }
            if (response.data.reason === "CLOSED") {
              setFieldError("siret", "Le numéro siret indique un établissement fermé.")
              setBandeau({
                header: "Votre centre de formation est renseigné comme fermé.",
                description: "Pour modifier les caractéristiques de votre organisme, vous pouvez vous rapprocher de l’INSEE afin de réaliser les modifications à la source.",
              })
            }
            if (response.data.reason === "UNKNOWN") {
              setFieldError("siret", "Le numéro siret n'est pas référencé comme centre de formation.")
              setBandeau({
                header: "Votre centre de formation n’est pas référencé dans notre catalogue.",
                description: "Pour ajouter une offre de formation au catalogue, renseignez-vous auprès du Carif-Oref de votre région : ",
                lien: "https://reseau.intercariforef.org/referencer-son-offre-de-formation",
              })
            }
          }

          setSubmitting(false)
        })
    }
  }

  return (
    <Formik
      validateOnMount
      initialValues={{ siret: undefined }}
      validationSchema={Yup.object().shape({
        siret: Yup.string()
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres")
          .required("champ obligatoire"),
      })}
      onSubmit={submitSiret}
    >
      {({ values, isValid, isSubmitting, setFieldValue, submitForm }) => {
        return (
          <>
            <Form>
              <CustomInput required={false} name="siret" label="SIRET" type="text" value={values.siret} maxLength="14" />
              {isCfa && (
                <Alert status="info" variant="top-accent">
                  <AlertIcon />
                  <Text>
                    Pour les organismes de formation,{" "}
                    <Link
                      variant="classic"
                      onClick={() => {
                        setIsCfa(false)
                        setFieldValue("siret", values.siret)
                        navigate("/creation/cfa")
                        submitForm()
                      }}
                    >
                      veuillez utiliser ce lien
                    </Link>
                  </Text>
                </Alert>
              )}
              <Flex justify="flex-end" mt={5}>
                <Button type="submit" variant="form" leftIcon={<SearchLine width={5} />} isActive={isValid} isDisabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                  Chercher
                </Button>
              </Flex>
            </Form>
          </>
        )
      }}
    </Formik>
  )
}

const InformationSiret = ({ type }) => {
  return (
    <Box border="1px solid #000091" p={["4", "8"]}>
      {type === AUTHTYPE.CFA && (
        <Stack direction="column" spacing={3} mb={5}>
          <Heading fontSize="24px">Comment s'inscrire ?</Heading>
          <Text>Pour créer le compte de votre organisme de formation, il faut :</Text>
          <UnorderedList>
            <ListItem mx={10} mb={5}>
              <span style={{ fontWeight: "700" }}>
                Être référencé dans
                <Link href="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements" variant="classic" isExternal>
                  le catalogue des offres de formations en apprentissage.
                </Link>
              </span>{" "}
              Pour ajouter une offre de formation au Catalogue de l’offre de formation en apprentissage, merci de la déclarer auprès du Carif-Oref de votre région en allant sur la
              page{" "}
              <a href="https://reseau.intercariforef.org/referencer-son-offre-de-formation" style={{ textDecoration: "underline" }} target="_blank">
                "référencer son offre de formation "
              </a>
            </ListItem>
            <ListItem mx={10}>
              <span style={{ fontWeight: "700" }}>Être certifié Qualiopi.</span>{" "}
              <a
                href="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs"
                style={{ textDecoration: "underline" }}
                target="_blank"
              >
                La certification
              </a>{" "}
              Qualiopi est l’unique moyen d’accéder au fichier national des organismes de formation référencés et de permettre à vos entreprises clientes de faire financer vos
              actions avec les fonds publics.
            </ListItem>
          </UnorderedList>
        </Stack>
      )}
      <Heading fontSize="24px" mb={3}>
        Où trouver votre SIRET ?
      </Heading>
      <Flex alignItems="flex-start">
        <InfoCircle mr={2} mt={1} />
        {type === AUTHTYPE.ENTREPRISE ? (
          <Text textAlign="justify">
            Le numéro d’identification de votre entreprise peut être trouvé sur
            <Link href="https://annuaire-entreprises.data.gouv.fr/" variant="classic" isExternal>
              l’annuaire des entreprises
            </Link>
            ou bien sur les registres de votre entreprise.
          </Text>
        ) : (
          <Text>
            Le numéro d’identification de votre organisme peut être trouvé sur le site
            <Link href="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements" variant="classic" isExternal>
              Le catalogue des offres de formations en apprentissage
            </Link>
            ou bien sur les registres de votre organisme de formation.
          </Text>
        )}
      </Flex>
    </Box>
  )
}

export default ({ type, widget }) => {
  const { setWidget, widget: wid } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const [qualiopi, setQualiopi] = useState()
  const [alert, setAlert] = useState()
  const [bandeau, setBandeau] = useState()
  const params = useParams()
  const [searchParams] = useSearchParams()

  let mobile = searchParams.get("mobile") === "true" ? true : false

  useState(() => {
    if (widget) {
      setWidget((prev) => ({ ...prev, isWidget: true, mobile: mobile ?? false }))
      setOrganisation(params.origine ?? "matcha")
    }
  }, [])

  return (
    <AuthentificationLayout>
      <AnimationContainer>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 0, 0, "75px"]} mt={wid.isWidget ? 0 : 12}>
          <Box>
            {wid.isWidget && (
              <Text textTransform="uppercase" fontSize="20px" color="#666666">
                Dépot simplifié d'offre en alternance
              </Text>
            )}
            <Heading>{type === AUTHTYPE.ENTREPRISE ? "Retrouvez votre entreprise" : "Créez votre compte"}</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2} mb={4}>
              Nous avons besoin du numéro SIRET de votre {type === AUTHTYPE.ENTREPRISE ? "entreprise" : "organisme de formation"} afin de vous identifier.
            </Text>
            <CreationCompte type={type} setQualiopi={setQualiopi} setBandeau={setBandeau} setAlert={setAlert} />
          </Box>
          <Box mt={[4, 4, 4, 0]}>{qualiopi ? <InformationLegaleEntreprise {...qualiopi} /> : <InformationSiret type={type} />}</Box>
        </SimpleGrid>
      </AnimationContainer>
    </AuthentificationLayout>
  )
}
