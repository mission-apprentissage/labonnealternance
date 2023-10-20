import { Flex, Image, Link } from "@chakra-ui/react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import React from "react"

import { ParameterContext } from "../../context/ParameterContextProvider"

const LogoLBA = () => {
  const router = useRouter()

  const { widgetParameters } = React.useContext(ParameterContext)

  const goToLbaHome = (e) => {
    if (widgetParameters) {
      const p = {
        type: "goToPage",
        // @ts-expect-error: TODO
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
      <NextLink legacyBehavior passHref href="/">
        <Link as="a" onClick={goToLbaHome} ml={4}>
          <Image
            // @ts-expect-error: TODO
            src={widgetParameters && widgetParameters?.parameters?.returnLogoURL ? widgetParameters.parameters.returnLogoURL : "/images/logo-violet-seul.svg"}
            alt="Retour page d'accueil de La bonne alternance"
          />
        </Link>
      </NextLink>
    </Flex>
  )
}

export default LogoLBA
