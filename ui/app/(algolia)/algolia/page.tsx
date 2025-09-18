"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import React, { useState } from "react"
import { InstantSearch, Hits, Highlight, Configure } from "react-instantsearch"

import CustomAddressInput from "@/app/(algolia)/_components/CustomAddressInput"
import { CustomPagination } from "@/app/(algolia)/_components/CustomPagination"
import { CustomRefinementList } from "@/app/(algolia)/_components/CustomRefinementList"
import { CustomSearchBox } from "@/app/(algolia)/_components/CustomSearchBox"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { publicConfig } from "@/config.public"
import { searchAddress } from "@/services/baseAdresse"

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
  const [coordinates, setCoordinates] = useState<string | null>(null)

  return (
    <Box sx={{ padding: fr.spacing("3w") }}>
      {/* set insight to true when going in user-testing phase or production */}
      <InstantSearch searchClient={searchClient} indexName="lba" insights={false} routing={true}>
        <Configure hitsPerPage={20} {...(coordinates && { aroundLatLng: coordinates })} />
        <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w") }}>
          <CustomSearchBox />
          <CustomAddressInput
            name="establishment_siret"
            handleSearch={(search: string) => searchAddress(search)}
            renderItem={({ label }) => <>{label}</>}
            itemToString={({ label }) => label}
            onInputFieldChange={() => {}}
            onSelectItem={(item) => {
              if (item && item.value && item.value.coordinates) {
                const [longitude, latitude] = item.value.coordinates
                setCoordinates(`${latitude},${longitude}`)
              } else {
                setCoordinates(null)
              }
            }}
            onError={() => {}}
            allowHealFromError={false}
            renderNoResult={undefined}
            renderError={() => null}
          />
        </Box>
        <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w") }}>
          <CustomRefinementList attribute="type" title="Type" />
          <CustomRefinementList attribute="level" title="Niveau" />
          <CustomRefinementList attribute="sub_type" title="Partenaire" />
          <CustomRefinementList attribute="organization_name" title="Entreprise" />
        </Box>

        <Hits hitComponent={Card} />
        {/* <InfiniteHits hitComponent={Card} /> */}
        <CustomPagination />
      </InstantSearch>
    </Box>
  )
}
