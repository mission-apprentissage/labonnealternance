"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import React from "react"
import { InstantSearch, Hits, Highlight, Index, Configure } from "react-instantsearch"

import { CustomRefinementList } from "@/app/(algolia)/_components/CustomRefinementList"
import { CustomSearchBox } from "@/app/(algolia)/_components/CustomSearchBox"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { publicConfig } from "@/config.public"

const { algoliaApiKey, algoliaAppId } = publicConfig

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey)

function HitFormation({ hit }: { hit: any }) {
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

function HitJob({ hit }: { hit: any }) {
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
      <InstantSearch searchClient={searchClient} indexName="lba_trainings" insights={false} routing={true}>
        <Configure hitsPerPage={10} />
        <CustomSearchBox />
        <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w") }}>
          <CustomRefinementList attribute="niveau" title="Niveau" />
          <Index indexName="lba_jobs">
            <CustomRefinementList attribute="workplace.name" title="Entreprise" />
            <CustomRefinementList attribute="identifier.partner_label" title="Partenaire" />
          </Index>
        </Box>
        <Index indexName="lba_trainings">
          <Hits hitComponent={HitFormation} />
        </Index>
        <Index indexName="lba_jobs">
          <Hits hitComponent={HitJob} />
        </Index>
      </InstantSearch>
    </Box>
  )
}
