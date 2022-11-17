import Breadcrumb from "components/breadcrumb"
import Navigation from "components/navigation"
import ScrollToTop from "components/ScrollToTop"
import React from "react"

import Footer from "components/footer"

import { NextSeo } from "next-seo"
import { getStaticMetiers, getStaticVilles } from "utils/getStaticData"

export default function Catalog(props) {
  return (
    <div>
      <NextSeo
        title={`Tous les emplois et formations en alternance | La bonne alternance | Trouvez votre alternance`}
        description={`Liste de métiers où trouver une formation ou un emploi en alternance`}
      />
      <ScrollToTop />
      <Navigation />
      <Breadcrumb forPage="metiers" label="Métiers" />

      <div className="c-page-container container my-0 mb-sm-5 pl-5 pt-3 pb-5">
        <h1 className="mt-4">
          <span className="d-block c-page-title is-color-1">Tous les emplois</span>
          <span className="d-block c-page-title is-color-2">et formations en alternance</span>
        </h1>
        <hr className="c-catalog-title-separator mt-4 mb-5" align="left" />

        <p>
          Vous voulez travailler en alternance ? Vous voulez obtenir un diplôme en alternance ? Toutes les informations pour trouver une alternance rapidement sont sur La bonne
          alternance :
          <ul className="mt-2">
            <li>Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation</li>
            <li>Liste d’entreprises qui recrutent en alternance</li>
            <li>Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master</li>
          </ul>
        </p>

        {props.dataJobs.map((job, index) => {
          return (
            <div key={index} className="mb-2 mb-lg-0">
              <span className="d-block d-lg-inline">Emploi en alternance et formation en alternance en </span>
              <span className="d-block d-lg-inline">
                <a href={`/metiers/${job.slug}`} className="c-catalog-link" aria-label={`Lancement d'une recherche sur le métier ${job.name}`}>
                  {job.name}
                </a>
              </span>
            </div>
          )
        })}
      </div>

      <Footer />
    </div>
  )
}

// See https://nextjs.org/learn/basics/data-fetching/with-data
// Static data, please restart nextjs each time this function change
export async function getStaticProps() {
  const path = require("path")
  const fs = require("fs")
  const txtDirectory = path.join(process.cwd(), "config")

  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  // The value of the `props` key will be
  //  passed to the `Catalog` component
  return {
    props: {
      dataJobs: dataJobs,
      dataTowns: dataTowns,
    },
  }
}
