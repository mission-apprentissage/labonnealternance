"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import React from "react"
import { InstantSearch, Hits, Highlight, Configure } from "react-instantsearch"

import { CustomRefinementList } from "@/app/(algolia)/_components/CustomRefinementList"
import { CustomSearchBox } from "@/app/(algolia)/_components/CustomSearchBox"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { publicConfig } from "@/config.public"

const { algoliaApiKey, algoliaAppId } = publicConfig

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey)

function Card({ hit }: { hit: any }) {
  return (
    <Box>
      {hit.type === "formation" ? <TagFormation /> : <TagOffreEmploi />}
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        <Highlight attribute="title" hit={hit} />
      </Typography>
      <Typography>{hit.organiztion_name}</Typography>
      <Typography>{hit.address}</Typography>
      <Typography></Typography>
    </Box>
  )
}

export default function AlogliaPage() {
  return (
    <Box sx={{ padding: fr.spacing("3w") }}>
      {/* set insight to true when going in user-testing phase or production */}
      <InstantSearch searchClient={searchClient} indexName="lba" insights={false} routing={true}>
        <Configure hitsPerPage={20} />
        <CustomSearchBox />
        <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w") }}>
          <CustomRefinementList attribute="type" title="Type" />
          <CustomRefinementList attribute="level" title="Niveau" />
          <CustomRefinementList attribute="sub_type" title="Partenaire" />
          <CustomRefinementList attribute="organization_name" title="Entreprise" />
        </Box>

        <Hits hitComponent={Card} />
        {/* <InfiniteHits hitComponent={Card} /> */}
      </InstantSearch>
    </Box>
  )
}
