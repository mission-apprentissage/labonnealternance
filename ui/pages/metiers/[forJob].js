import React from 'react'
import { getStaticMetiers, getStaticVilles } from 'utils/getStaticData'
import Navigation from 'components/navigation'
import { useSelector } from 'react-redux'
import Footer from "components/footer";
import { NextSeo } from 'next-seo';

export default function ForJob(props) {

  const routerState = useSelector(state => state.router)
  const find = require("lodash").find;
  const last = require("lodash").last;
  const sortBy = require("lodash").sortBy;
  const currentSlug = last(routerState.location.href.split('/'))
  const currentJob = find(props.dataJobs, (e) => e.slug === currentSlug)
  const sortedTowns = sortBy(props.dataTowns, (e) => e.slug)


  return (
    <div>
      <NextSeo
        title={`Métier : ${currentJob.name} | La Bonne Alternance | Trouvez votre alternance`}
        description={`Villes où chercher le métier ${currentJob.name}`}
      />
      <Navigation />
      <div className="c-about c-page-container container my-0 mb-sm-5 p-5">
        <a href="/metiers/">Revenir</a>
        <h1 className="mt-4">Villes où chercher le métier</h1>
        <h1 className="mb-4">" {currentJob.name} "</h1>

        {
          sortedTowns.map((currentTown, index) => {
            return <div key={index}><a href={`/metiers/${currentJob.slug}/${currentTown.slug}`}>{currentTown.name}</a></div>
          })
        }
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
  
  const mapped_pathes = dataJobs.map((e) => { return { params: { forJob: e.slug } } })
  // console.log('mapped_pathes', mapped_pathes);

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
