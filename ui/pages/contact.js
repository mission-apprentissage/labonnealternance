import Breadcrumb from "components/breadcrumb"
import Footer from "components/footer"
import Navigation from "components/navigation"
import ScrollToTop from "components/ScrollToTop"
import Link from "next/link"
import React from "react"

import { NextSeo } from "next-seo"

const contact = () => (
  <div>
    <NextSeo title="Contact | La bonne alternance | Trouvez votre alternance" description="Une remarque, un avis, une suggestion d’amélioration ? Contactez-nous !" />
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="contact" label="Contact" />
    <div className="c-page-container container my-0 mb-sm-5 p-5">
      <div className="row">
        <div className="col-12 col-md-4 mb-4">
          <h1>
            <span className="d-block c-page-title is-color-2">Contact</span>
          </h1>
          <hr className="c-page-title-separator" align="left" />
        </div>
        <div className="col-12 col-md-8 mb-3">
          <h3>Nous contacter</h3>
          <p>Vous avez une question sur nos outils ? Consultez notre foire aux questions. </p>
          <div className="my-5 d-flex-center">
            <Link href="/faq">
              <a aria-label="Accès à la Foire aux questions" className="c-homecomponent-link c-homecomponent-link__first">
                Consulter la FAQ
              </a>
            </Link>
          </div>
          <div className="text-break">
            <p>
              Si jamais vous ne trouvez pas votre réponse dans notre FAQ, ou souhaitez nous partager votre avis ou une suggestion d’amélioration sur nos outils, contactez nous par
              email.
            </p>
            <p>
              <b>Vous êtes candidat,</b> écrivez-nous en cliquant sur ce <br />
              <a
                aria-label="Envoi d'un email au service candidat de La bonne alternance"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20Candidat"
              >
                lien vers notre adresse email
              </a>
            </p>
            <p>
              <b>Vous êtes un organisme de formation,</b> écrivez-nous en cliquant sur ce <br />
              <a
                aria-label="Envoi d'un email au service organisme de formation de La bonne alternance"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20OF"
              >
                lien vers notre adresse email
              </a>
            </p>
            <p>
              <b>Vous êtes une entreprise recevant des candidatures spontanées,</b> écrivez-nous en cliquant sur ce{" "}
              <a
                aria-label="Envoi d'un email au service entreprise de La bonne alternance"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20Entreprise%20-%20Candidature%20spontanée"
              >
                lien vers notre adresse email
              </a>
            </p>
            <p>
              <b>Vous êtes une entreprise intéressée par notre service de dépôt d&apos;offre simplifié,</b> écrivez-nous en cliquant sur ce{" "}
              <a
                aria-label="Envoi d'un email au service recruteur de La bonne alternance"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20Entreprise%20-%20Depot%20offre"
              >
                lien vers notre adresse email
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="mb-3">&nbsp;</div>
    <Footer />
  </div>
)

export default contact
