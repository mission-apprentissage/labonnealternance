import * as Yup from "yup"
import { Box, Container, Input, Button, Text } from "@chakra-ui/react"
import { Formik, Field, Form } from "formik"
import { useNavigate } from "react-router-dom"
import useAuth from "../../common/hooks/useAuth"
import { _post } from "../../common/httpClient"

const ForgottenPasswordPage = () => {
  let [, setAuth] = useAuth()
  const navigate = useNavigate()

  let showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {}
  }

  let resetPassword = async (values, { setStatus }) => {
    try {
      let { token } = await _post("/api/password/forgotten-password", { ...values })
      setAuth(token)
      setStatus({ message: "Un email vous a été envoyé." })
      setTimeout(() => navigate("/"), 1500)
    } catch (e) {
      console.error(e)
      setStatus({ error: e.prettyMessage })
    }
  }

  return (
    <Box p={5} bg="#FAFAFA">
      <Container border="1px solid #E0E5ED" bg="white" p={0} maxW="35ch">
        <Box borderBottom="1px solid #E0E5ED" p={4}>
          <Text fontSize="16px" ml={2}>
            Mot de passe oublié
          </Text>
        </Box>
        <Box mx={5} mt={5}>
          <Formik
            initialValues={{
              username: "",
            }}
            validationSchema={Yup.object().shape({
              username: Yup.string().required("Veuillez saisir un identifiant"),
            })}
            onSubmit={resetPassword}
          >
            {({ status = {} }) => {
              return (
                <Form>
                  <Text textStyle="h6" fontSize="12px">
                    Identifiant
                  </Text>
                  <Field name="username">
                    {({ field, meta }) => {
                      return <Input type={"text"} placeholder="Votre identifiant..." {...field} {...showError(meta)} />
                    }}
                  </Field>
                  <Button variant="primary" type={"submit"} fontSize="12px" fontWeight="700" mt={5}>
                    Demander un nouveau mot de passe
                  </Button>
                  <Box mb={5}>
                    {status.error && <Text color="#cd201f">{status.error}</Text>}
                    {status.message && <Text color="#316100">{status.message}</Text>}
                  </Box>
                </Form>
              )
            }}
          </Formik>
        </Box>
      </Container>
    </Box>
  )
}

export default ForgottenPasswordPage
