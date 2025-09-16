"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import React from "react"
import { InstantSearch, Hits, Highlight, RefinementList, Index, Configure } from "react-instantsearch"

import { CustomSearchBox } from "@/app/(algolia)/_components/CustomSearchBox"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { publicConfig } from "@/config.public"

const { algoliaApiKey, algoliaAppId } = publicConfig

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey)

function HitFormation(props) {
  const { hit } = props
  return (
    <Box>
      <TagFormation />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        <Highlight attribute="intitule_long" hit={hit} />
      </Typography>
      <Typography>{hit.etablissement_formateur_entreprise_raison_sociale}</Typography>
      <Typography>
        {hit.etablissement_formateur_adresse} {hit.etablissement_formateur_code_postal} {hit.etablissement_formateur_localite}
      </Typography>
      <Typography></Typography>
    </Box>
  )
}

function HitJob(props) {
  const { hit } = props
  return (
    <Box>
      <TagOffreEmploi />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        <Highlight attribute="offer.title" hit={hit} />
      </Typography>
      <Typography>{hit.workplace.name}</Typography>
      <Typography>{hit.workplace.location.address}</Typography>
      <Typography></Typography>
    </Box>
  )
}

export default function AlogliaPage() {
  return (
    <Box sx={{ padding: fr.spacing("3w") }}>
      {/* set insight to true when going in user-testing phase or production */}
      <InstantSearch searchClient={searchClient} indexName="lba_trainings" insights={false}>
        <Configure hitsPerPage={10} />
        <CustomSearchBox />
        <RefinementList attribute="niveau" />
        <Index indexName="lba_jobs">
          <Box>
            <RefinementList attribute="workplace.name" />
            <RefinementList attribute="identifier.partner_label" />
          </Box>
          <Hits hitComponent={HitJob} />
        </Index>
        <Index indexName="lba_trainings">
          <Hits hitComponent={HitFormation} />
        </Index>
      </InstantSearch>
    </Box>
  )
}
