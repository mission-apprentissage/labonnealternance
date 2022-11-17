import * as Yup from "yup"
import { Formik, Field, Form } from "formik"
import { useNavigate } from "react-router-dom"
import { Box, Container, Input, Button, Link, Text, Flex, Heading } from "@chakra-ui/react"
import useAuth from "../common/hooks/useAuth"
import { _post } from "../common/httpClient"
import { Breadcrumb } from "../common/components/Breadcrumb"
import React from "react"
import Layout from "../common/components/Layout"
import { setTitle } from "../common/utils/pageUtils"

const LoginPage = () => {
  let [, setAuth] = useAuth()
  const navigate = useNavigate()

  const title = "Authentification"
  setTitle(title)

  let feedback = (meta, message) => {
    return meta.touched && meta.error
      ? {
          feedback: message,
          invalid: true,
        }
      : {}
  }

  let login = async (values, { setStatus }) => {
    try {
      let { token } = await _post("/api/login", values)
      setAuth(token)
      navigate("/admin")
    } catch (e) {
      console.error(e)
      setStatus({ error: e.prettyMessage })
    }
  }

  return (
    <Layout>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]}>
        <Container maxW="xl" mb={20}>
          <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
          <Heading textStyle="h2" mt={5}>
            {title}
          </Heading>
          <Container bg="white" p={0} maxW="35ch">
            <Box borderBottom="1px solid #E0E5ED" p={4}>
              <Text fontSize="16px" ml={2}>
                Connexion
              </Text>
            </Box>
            <Box mx={5} mt={5}>
              <Formik
                initialValues={{
                  username: "",
                  password: "",
                }}
                validationSchema={Yup.object().shape({
                  username: Yup.string().required("Requis"),
                  password: Yup.string().required("Requis"),
                })}
                onSubmit={login}
              >
                {({ status = {} }) => {
                  return (
                    <Form>
                      <Box>
                        <Text textStyle="h6" fontSize="12px">
                          Identifiant
                        </Text>
                        <Field name="username">
                          {({ field, meta }) => {
                            return <Input placeholder="Votre identifiant..." {...field} {...feedback(meta, "Identifiant invalide")} />
                          }}
                        </Field>
                      </Box>
                      <Box mt={3}>
                        <Text textStyle="h6" fontSize="12px">
                          Mot de passe
                        </Text>
                        <Field name="password">
                          {({ field, meta }) => {
                            return <Input type={"password"} placeholder="Votre mot de passe..." {...field} {...feedback(meta, "Mot de passe invalide")} />
                          }}
                        </Field>
                      </Box>
                      <Flex mt={5} justifyContent="space-between">
                        <Button variant="primary" type={"submit"} fontSize="12px" fontWeight="700">
                          Connexion
                        </Button>

                        <Link href="/forgotten-password" color="info" mt={1}>
                          Mot de passe oublié
                        </Link>
                      </Flex>
                      <Box mb={5}>{status.error && <Text color="#cd201f">{status.error}</Text>}</Box>
                    </Form>
                  )
                }}
              </Formik>
            </Box>
          </Container>
        </Container>
      </Box>
    </Layout>
  )
}

export default LoginPage
