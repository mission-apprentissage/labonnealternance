import React from "react"
import Link from "next/link"
import logoLBA from "../../public/images/logo-violet-seul.svg"
import { useRouter } from "next/router"
import { ParameterContext } from "../../context/ParameterContextProvider"

const LogoIdea = () => {
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
    <div className="mr-4 c-logoheader">
      <Link href="/">
        <a onClick={goToLbaHome} className="ml-3">
          <img
            src={widgetParameters && widgetParameters?.parameters?.returnLogoURL ? widgetParameters.parameters.returnLogoURL : logoLBA}
            alt="Retour page d'accueil de La bonne alternance"
          />
        </a>
      </Link>
    </div>
  )
}

export default LogoIdea
