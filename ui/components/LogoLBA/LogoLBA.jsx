import { Flex, Image, Link } from "@chakra-ui/react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import React from "react"

import { ParameterContext } from "../../context/ParameterContextProvider"
import logoLBA from "../../public/images/logo-violet-seul.svg"

const LogoLBA = () => {
  const router = useRouter()

  const { widgetParameters } = React.useContext(ParameterContext)

  const goToLbaHome = (e) => {
    if (widgetParameters) {
      let p = {
        type: "goToPage",
        page: widgetParameters && widgetParameters?.parameters?.returnURI ? widgetParameters.parameters.returnURI : "/",
      }
      if (typeof window !== "undefined") {
        window.parent.postMessage(p, "*")
      }
    } else {
      e.preventDefault()
      router.push("/")
    }
  }

  return (
    <Flex display={{ base: "none", lg: "flex" }} alignItems="center" mr={8}>
      <NextLink passHref href="/">
        <Link as="a" onClick={goToLbaHome} ml={4}>
          <Image
            src={widgetParameters && widgetParameters?.parameters?.returnLogoURL ? widgetParameters.parameters.returnLogoURL : logoLBA}
            alt="Retour page d'accueil de La bonne alternance"
          />
        </Link>
      </NextLink>
    </Flex>
  )
}

export default LogoLBA
