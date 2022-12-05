import queryString from "query-string"
import * as Yup from "yup"
import { Box, Container, Input, Button, Text } from "@chakra-ui/react"
import { Formik, Field, Form } from "formik"
import { useNavigate, useLocation } from "react-router-dom"
import useAuth from "../../common/hooks/useAuth"
import { _post } from "../../common/httpClient"
import decodeJWT from "../../common/utils/decodeJWT"

const ResetPasswordPage = () => {
  let [, setAuth] = useAuth()
  const navigate = useNavigate()
  let location = useLocation()
  let { passwordToken } = queryString.parse(location.search)
  let uai = decodeJWT(passwordToken).sub

  let showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {}
  }

  let changePassword = async (values, { setStatus }) => {
    try {
      let { token } = await _post("/api/password/reset-password", { ...values, passwordToken })
      setAuth(token)
      navigate("/")
    } catch (e) {
      console.error(e)
      setStatus({
        error: (
          <span>
            Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse mail :
            <br />
            <a href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Reinitialiser%20mot%20de%20passe%20LBAR%20-%20Lien%20expire">
              labonnealternance@apprentissage.beta.gouv.fr
            </a>
          </span>
        ),
      })
    }
  }

  return (
    <Box p={5} bg="#FAFAFA">
      <Container border="1px solid #E0E5ED" bg="white" p={0} maxW="45ch">
        <Box borderBottom="1px solid #E0E5ED" p={4}>
          <Text fontSize="16px" ml={2}>
            Changement du mot de passe pour le CFA {uai}
          </Text>
        </Box>
        <Box mx={5} mt={5}>
          <Formik
            initialValues={{
              newPassword: "",
            }}
            validationSchema={Yup.object().shape({
              newPassword: Yup.string()
                .required("Veuillez saisir un mot de passe")
                .matches(
                  "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
                  "Le mot de passe doit contenir au moins 8 caractères, une lettre en majuscule, un chiffre et un caractère spécial"
                ),
            })}
            onSubmit={changePassword}
          >
            {({ status = {} }) => {
              return (
                <Form>
                  <Text textStyle="h6" fontSize="12px">
                    Nouveau mot de passe
                  </Text>
                  <Field name="newPassword">{({ field, meta }) => <Input type={"password"} placeholder="Votre mot de passe..." {...field} {...showError(meta)} />}</Field>
                  <Button variant="primary" type={"submit"} fontSize="12px" fontWeight="700" mt={5}>
                    Réinitialiser le mot de passe
                  </Button>
                  <Box mb={5}>{status.error && <Text color="#cd201f">{status.error}</Text>}</Box>
                </Form>
              )
            }}
          </Formik>
        </Box>
      </Container>
    </Box>
  )
}

export default ResetPasswordPage
