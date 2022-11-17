import React, { useEffect } from "react"
import Navigation from "../components/navigation"
import HomeHero from "../components/HomeHero"
import HowTo from "../components/HowTo"
import AlgoHome from "../components/HomeComponents/AlgoHome"
import HomeReview from "../components/HomeReview"
import { initParametersFromQuery } from "../services/config"
import Footer from "../components/footer"
import { useRouter } from "next/router"

import ScrollToTop from "../components/ScrollToTop"
import howtocircle1 from "../public/images/howtocircle1.svg"
import howtocircle2 from "../public/images/howtocircle2.svg"
import howtocircle3 from "../public/images/howtocircle3.svg"
import howtocircle4 from "../public/images/howtocircle4.svg"
import howtocircle5 from "../public/images/howtocircle5.svg"
import axios from "axios"
import csvToArray from "../utils/csvToArray.js"
import { some } from "lodash"
import { ParameterContext } from "../context/ParameterContextProvider"
import AmeliorerLBA from "../components/HomeComponents/AmeliorerLBA"

const Home = (props) => {
  const router = useRouter()

  const parameterContext = React.useContext(ParameterContext)

  useEffect(() => {
    initParametersFromQuery({ router, shouldPush: "shouldPushPathname", parameterContext })
  }, [])

  return (
    <div>
      <ScrollToTop />
      <Navigation />
      <div className="c-homebg c-homebg--light">
        <img src={howtocircle1} className="c-homebg-img c-homebg-img--circle c-homebg-img--circle1" alt="" />
        <img src={howtocircle2} className="c-homebg-img c-homebg-img--circle c-homebg-img--circle2" alt="" />
        <img src={howtocircle3} className="c-homebg-img c-homebg-img--circle c-homebg-img--circle3" alt="" />
        <img src={howtocircle4} className="c-homebg-img c-homebg-img--circle c-homebg-img--circle4" alt="" />
        <img src={howtocircle5} className="c-homebg-img c-homebg-img--circle c-homebg-img--circle5" alt="" />
        <HomeHero />
        <HowTo />
      </div>
      <div className="c-homebg py-5">
        <AlgoHome />
      </div>

      <div className="c-homebg">
        <AmeliorerLBA />
      </div>

      <HomeReview reviews={props.reviews} />

      <Footer />
    </div>
  )
}

// This function gets called at build time on server-side.
// It won't be called on client-side, so you can even do
// direct database queries.
export async function getStaticProps() {
  // Call an external API endpoint to get reviews.
  // You can use any data fetching library
  const reviews = await getAllReviews()

  // By returning { props: { reviews } }, the Blog component
  // will receive `reviews` as a prop at build time
  return {
    props: {
      reviews,
    },
  }
}

async function getAllReviews() {
  const response = await axios.get("https://raw.githubusercontent.com/mission-apprentissage/labonnealternance/datasets/ui/config/review.csv")
  const csv = csvToArray(response.data)

  /*
    [
      {
        PETIT_TITRE_1: 'Un petit titre',
        GROS_TITRE_2: 'Un gros titre',
        TEXTE_1_NON_GRAS: ' Un texte non gras',
        TEXTE_2_GRAS: ' Un texte gras',
        LIBELLE_CTA: ' Visitez le site',
        URL_CTA: 'https://mission-apprentissage.gitbook.io/general/',
        '': ''
      },
      {
        PETIT_TITRE_1: '',
        GROS_TITRE_2: undefined,
        TEXTE_1_NON_GRAS: undefined,
        TEXTE_2_GRAS: undefined,
        LIBELLE_CTA: undefined,
        URL_CTA: undefined,
        '': undefined
      }
    ]
  */

  const cleanedCsv = csv
    // the filter will clear the object with falsy-only values
    .filter((e) => {
      return some(e, (k) => !!k)
    })
    // the map will clear the property ''
    .map((e) => {
      delete e[""]
      // trim all values
      Object.keys(e).forEach((k) => (e[k] = e[k].trim()))
      return e
    })

  let result = cleanedCsv[0] || {}

  return {} /*result*/
}

export default Home
