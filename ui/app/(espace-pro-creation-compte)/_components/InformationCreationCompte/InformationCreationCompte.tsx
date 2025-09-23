"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { assertUnreachable, parseEnum } from "shared"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import * as Yup from "yup"

import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { InformationOpco } from "@/app/(espace-pro-creation-compte)/_components/InformationOpco"
import CustomInput from "@/app/_components/CustomInput"
import { infosOpcos } from "@/theme/components/logos/infosOpcos"
import { ApiError, apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { OpcoSelect } from "../../../(espace-pro)/_components/OpcoSelect"
import { AUTHTYPE } from "../../../../common/contants"
import { phoneValidation } from "../../../../common/validation/fieldValidations"
import { AnimationContainer } from "../../../../components/espace_pro/index"
import { WidgetContext } from "../../../../context/contextWidget"
import { ArrowRightLine } from "../../../../theme/components/icons"
import { getEntrepriseOpco } from "../../../../utils/api"

const Formulaire = ({
  onSubmit,
  siret: establishment_siret,
  type,
  origin,
  email,
  viewerType,
}: {
  onSubmit: (values: any, { setSubmitting, setFieldError }: any) => void
  siret: string
  type: "CFA" | "ENTREPRISE"
  origin: string
  email?: string
  viewerType: AUTHTYPE
}) => {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)

  const { data: opcoData } = useQuery({
    queryKey: ["getEntrepriseOpco", establishment_siret],
    queryFn: () => getEntrepriseOpco(establishment_siret),
  })

  const parsedOpco = parseEnum(OPCOS_LABEL, opcoData?.opco)
  const opco = parsedOpco === OPCOS_LABEL.UNKNOWN_OPCO ? undefined : parsedOpco

  const shouldSelectOpco = type === AUTHTYPE.ENTREPRISE && !opco

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        opco: opco ?? "",
        last_name: "",
        first_name: "",
        phone: "",
        email,
        origin: origin ?? "lba",
      }}
      validationSchema={Yup.object().shape({
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: phoneValidation().required("champ obligatoire"),
        email: Yup.string().email("Insérez un email valide").lowercase().required("champ obligatoire"),
        opco: shouldSelectOpco ? Yup.string().required("champ obligatoire") : Yup.string(),
      })}
      onSubmit={onSubmit}
    >
      {({ values, isValid, isSubmitting, setFieldValue, errors, touched }) => {
        const infosOpco = infosOpcos.find((x) => x.nom === values.opco)
        return (
          <Form>
            <FormulaireLayout
              type={type}
              left={
                <>
                  <CustomInput required={false} name="last_name" label="Nom" type="text" value={values.last_name} />
                  <CustomInput required={false} name="first_name" label="Prénom" type="text" value={values.first_name} />
                  <CustomInput required={false} name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                  <CustomInput
                    required={false}
                    isDisabled={email ? true : false}
                    name="email"
                    label="Email"
                    type="email"
                    value={values.email}
                    info={
                      email
                        ? "L’email que nous utilisons est fourni par votre Carif Oref, et permet de vous connecter. Vous pourrez le modifier dans votre espace personnel."
                        : "Privilégiez votre adresse professionnelle"
                    }
                  />
                  {shouldSelectOpco && (
                    <OpcoSelect name="opco" onChange={(newValue) => setFieldValue("opco", newValue)} value={values.opco as OPCOS_LABEL} errors={errors} touched={touched} />
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: fr.spacing("5v") }}>
                    {!widget?.isWidget && (
                      <Box sx={{ mr: fr.spacing("5v") }}>
                        <Button type="button" priority="secondary" onClick={() => router.back()}>
                          Annuler
                        </Button>
                      </Box>
                    )}
                    <Button type="submit" disabled={!isValid || isSubmitting}>
                      {isSubmitting ? (
                        <CircularProgress sx={{ color: "inherit", mr: fr.spacing("1w") }} thickness={4} size={20} />
                      ) : (
                        <ArrowRightLine sx={{ width: 16, height: 16, mr: fr.spacing("1w") }} />
                      )}
                      Suivant
                    </Button>
                  </Box>
                </>
              }
              right={
                <>
                  <InformationLegaleEntreprise siret={establishment_siret} type={type as typeof CFA | typeof ENTREPRISE} opco={opco} viewerType={viewerType} />
                  {infosOpco && <InformationOpco isUpdatable={shouldSelectOpco} infosOpco={infosOpco} resetOpcoChoice={() => setFieldValue("opco", "")} />}
                </>
              }
            />
          </Form>
        )
      }}
    </Formik>
  )
}

const FormulaireLayout = ({ left, right, type }: { left: React.ReactNode; right: React.ReactNode; type: string }) => {
  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }, gridTemplateRows: { xs: "repeat(3, auto)", md: "auto 1fr" }, mt: 0 }}
      rowGap={4}
      columnGap={4}
    >
      <Box>
        <Typography component="h2" sx={{ fontSize: "24px", fontWeight: "bold" }}>
          {type === AUTHTYPE.ENTREPRISE ? "Vos informations de contact" : "Créez votre compte"}
        </Typography>
        <Box sx={{ fontSize: "20px", mb: fr.spacing("2w"), pt: fr.spacing("1w"), pb: fr.spacing("2w") }}>
          <Typography>
            {type === AUTHTYPE.ENTREPRISE
              ? "Seul le numéro de téléphone sera visible sur vos offres. Vous recevrez les candidatures sur l'email renseigné."
              : "Seul le numéro de téléphone sera visible sur les offres de vos entreprises partenaires. Vous recevrez les candidatures sur l'email renseigné."}
          </Typography>
        </Box>
        <Box>{left}</Box>
      </Box>
      <Box>{right}</Box>
    </Box>
  )
}

export const InformationCreationCompte = ({
  isWidget = false,
  establishment_siret,
  email,
  origin,
  type,
}: {
  isWidget?: boolean
  establishment_siret: string
  email?: string
  origin: string
  type: "CFA" | "ENTREPRISE"
}) => {
  const router = useRouter()

  const submitForm = (values: any, { setSubmitting, setFieldError }: any) => {
    const payload = { ...values, type, establishment_siret }
    if (type === AUTHTYPE.CFA) {
      payload.opco = OPCOS_LABEL.UNKNOWN_OPCO
    }
    apiPost("/etablissement/creation", { body: payload })
      .then((data) => {
        if (!data) {
          throw new Error("no data")
        }
        const { user, formulaire, token, validated } = data

        if (!user) {
          throw new Error("unexpected: data.user is empty")
        }

        switch (type) {
          case AUTHTYPE.ENTREPRISE: {
            router.push(
              PAGES.dynamic
                .espaceProCreationOffre({
                  establishment_id: formulaire.establishment_id,
                  type,
                  email: user.email,
                  userId: user._id.toString(),
                  token,
                  displayBanner: !validated,
                  isWidget,
                })
                .getPath()
            )
            break
          }
          case AUTHTYPE.CFA: {
            if (validated) {
              router.push(PAGES.dynamic.backCreateCFAConfirmation({ email: user.email }).getPath())
            } else {
              router.push(PAGES.static.backCreateCFAEnAttente.getPath())
            }
            break
          }
          default:
            assertUnreachable(type)
            break
        }
        setSubmitting(false)
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          setFieldError("email", error.message)
          setSubmitting(false)
        }
      })
  }

  return (
    <AnimationContainer>
      <Formulaire onSubmit={submitForm} siret={establishment_siret} type={type} origin={origin} email={email} viewerType={type} />
    </AnimationContainer>
  )
}
