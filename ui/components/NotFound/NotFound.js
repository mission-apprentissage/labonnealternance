import lostCat from "public/images/lostCat.svg"
import React from "react"
import Footer from "../footer"

const NotFound = () => (
  <>
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="row">
          <div className="col-12 col-lg-6 order-lg-2">
            <img src={lostCat} alt="Chat perdu" className="w-75" />
          </div>
          <div className="col-12 col-lg-6 order-lg-1">
            <h1 className="not-found-title">404</h1>
            <strong className="not-found-subtitle">Vous êtes perdu ?</strong>
            <p className="not-found-text">
              Il semble que la page que vous essayez de rejoindre n&apos;existe pas. En cas de problème pour retrouver la page, essayez de repartir de la page d&apos;accueil en
              cliquant sur le lien ci-dessous.
            </p>
            <div className="mt-4 mb-5 mb-lg-0">
              <a href="https://labonnealternance.apprentissage.beta.gouv.fr" className="btn btn-block btn-primary mb-2 mx-auto w-50">
                Page d&apos;accueil
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="not-found-footer">
        <Footer />
      </div>
    </div>
  </>
)

export default NotFound
