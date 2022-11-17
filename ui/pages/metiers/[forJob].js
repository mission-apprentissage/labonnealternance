import React from "react"
import { getStaticMetiers, getStaticVilles } from "utils/getStaticData"
import Navigation from "components/navigation"
import { useRouter } from "next/router"
import Footer from "components/footer"
import { NextSeo } from "next-seo"
import Breadcrumb from "components/breadcrumb"

export default function ForJob(props) {
  const router = useRouter()

  const find = require("lodash").find
  const sortBy = require("lodash").sortBy
  const currentSlug = router.query.forJob
  const currentJob = find(props.dataJobs, (e) => e.slug === currentSlug)
  const sortedTowns = sortBy(props.dataTowns, (e) => e.slug)

  const navigationItems = [
    { title: "Métiers", path: "metiers" },
    { title: currentJob.name, path: `metiers/${currentSlug}` },
  ]

  return (
    <div>
      <NextSeo
        title={`Tous les emplois et formations en alternance en ${currentJob.name} | La bonne alternance | Trouvez votre alternance`}
        description={`Villes où chercher des emplois et formations en alternance pour le métier ${currentJob.name}`}
      />
      <Navigation />
      <Breadcrumb items={navigationItems} />
      <div className="c-about c-page-container container my-0 mb-sm-5 p-5">
        <h1 className="mt-0">
          <span className="d-block c-page-title is-color-1">Tous les emplois et formations</span>
          <span className="d-block c-page-title is-color-2">
            en alternance en <i>{currentJob.name}</i>
          </span>
        </h1>
        <hr className="c-catalog-title-separator mt-4 mb-5" align="left" />

        <p>
          Vous êtes à seulement 2 clics d&apos;obtenir toutes les informations pour trouver une alternance rapidement sur La Bonne Alternance :
          <ul className="mt-2">
            <li>
              Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation en <i>{currentJob.name}</i>
            </li>
            <li>
              Liste d’entreprises qui recrutent en alternance en <i>{currentJob.name}</i>
            </li>
            <li>
              Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master en <i>{currentJob.name}</i>
            </li>
          </ul>
        </p>

        {sortedTowns.map((currentTown, index) => {
          return (
            <div key={index}>
              <span className="d-block d-lg-inline">Emploi en alternance et formation en alternance en </span>
              <span className="d-block d-lg-inline">
                <a href={`/metiers/${currentJob.slug}/${currentTown.slug}`} className="c-catalog-link">
                  {currentJob.name} à {currentTown.name}
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

// Required.
// See https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation
export async function getStaticPaths() {
  const path = require("path")
  const fs = require("fs")
  const txtDirectory = path.join(process.cwd(), "config")

  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  const mapped_pathes = dataJobs.map((e) => {
    return { params: { forJob: e.slug } }
  })

  return {
    paths: mapped_pathes,
    fallback: false,
  }
}

// See https://nextjs.org/learn/basics/data-fetching/with-data
// Static data, please restart nextjs each time this function change
export async function getStaticProps() {
  const path = require("path")
  const fs = require("fs")
  const txtDirectory = path.join(process.cwd(), "config")

  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  return {
    props: {
      dataTowns: dataTowns,
      dataJobs: dataJobs,
    },
  }
}
