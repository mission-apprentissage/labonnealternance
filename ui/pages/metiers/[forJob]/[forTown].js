import React from 'react'
import { getStaticMetiers, getStaticVilles } from 'utils/getStaticData'
import { buildLinkForTownAndJob } from 'utils/buildLinkForTownAndJob'
import Navigation from 'components/navigation'
import { useSelector } from 'react-redux'
import Footer from "components/footer";
import { NextSeo } from 'next-seo';


export default function ForTown(props) {

  const routerState = useSelector(state => state.router)
  const find = require("lodash").find;
  const nth = require("lodash").nth;
  const slugs = routerState.location.href.split('/')
  const currentTownSlug = nth(slugs, -1)
  const currentJobSlug = nth(slugs, -2)
  const currentJob = find(props.dataJobs, (e) => e.slug === currentJobSlug)
  const currentTown = find(props.dataTowns, (e) => e.slug === currentTownSlug)


  return (
    <div>
      <NextSeo
        title={`Métier : ${currentJob.name}, à ${currentTown.name} | La Bonne Alternance | Trouvez votre alternance`}
        description={`Chercher le métier ${currentJob.name} dans la ville suivante : ${currentTown.name}`}
      />
      <Navigation />
      <div className="c-about c-page-container container my-0 mb-sm-5 p-5">
        <a href={`/metiers/${currentJob.slug}`}>Revenir</a>
        <h1 className="mb-4 mt-4">Le métier {currentJob.name} à {currentTown.name}</h1>
        <h2 className="h6">Rechercher un métier, une formation dans le domaine "{currentJob.name}"</h2>
        <h2 className="h6 mb-5">à {currentTown.name} ou ses environs</h2>

        <a 
          href={buildLinkForTownAndJob(currentTown, currentJob)}
          className="btn btn-primary"
        >
            Lancer cette recherche
        </a>

      </div>
      <Footer />
    </div>
  )
}

// Required.
// See https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation
export async function getStaticPaths() {
  const path = require('path');
  const fs = require('fs');
  const txtDirectory = path.join(process.cwd(), 'config')

  const dataJobs = getStaticMetiers(path, fs, txtDirectory)
  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const flatten = require("lodash").flatten;



  const mapped_pathes = flatten(dataJobs.map((job) => {
    return dataTowns.map((town) => {
      return { 
        params: { 
          forJob: job.slug,
          forTown: town.slug,
        } 
      } 
    })
  }))

  console.log('mapped_pathes', mapped_pathes);

  return {
    paths: mapped_pathes,
    fallback: false
  }
}

// See https://nextjs.org/learn/basics/data-fetching/with-data
// Static data, please restart nextjs each time this function change
export async function getStaticProps() {
  const path = require('path');
  const fs = require('fs');
  const txtDirectory = path.join(process.cwd(), 'config')
  
  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const dataJobs = getStaticMetiers(path, fs, txtDirectory)
  
  return {
    props: {
      dataTowns: dataTowns,
      dataJobs: dataJobs
    }
  }
}
