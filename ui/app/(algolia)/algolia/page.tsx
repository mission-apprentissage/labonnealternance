"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import { history } from "instantsearch.js/es/lib/routers"
import React from "react"
import { InstantSearch, Hits, Highlight, Configure, useInstantSearch } from "react-instantsearch"

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

const customStateMapping = {
  stateToRoute(uiState: any) {
    const indexUiState = uiState.lba || {}
    return {
      q: indexUiState.query,
      type: indexUiState.refinementList?.type,
      level: indexUiState.refinementList?.level,
      sub_type: indexUiState.refinementList?.sub_type,
      organization_name: indexUiState.refinementList?.organization_name,
      page: indexUiState.page,
      coordinates: indexUiState.configure?.aroundLatLng,
    }
  },
  routeToState(routeState: any) {
    return {
      lba: {
        query: routeState.q,
        refinementList: {
          type: routeState.type,
          level: routeState.level,
          sub_type: routeState.sub_type,
          organization_name: routeState.organization_name,
        },
        page: routeState.page,
        configure: {
          ...(routeState.coordinates && { aroundLatLng: routeState.coordinates }),
        },
      },
    }
  },
}

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

function AddressInputWithRouting() {
  const { setUiState } = useInstantSearch()

  const handleAddressSelect = (item: any) => {
    if (item && item.value && item.value.coordinates) {
      const [longitude, latitude] = item.value.coordinates
      const coordinates = `${latitude},${longitude}`

      setUiState((prevUiState) => ({
        ...prevUiState,
        lba: {
          ...prevUiState.lba,
          configure: {
            ...prevUiState.lba?.configure,
            aroundLatLng: coordinates,
          },
        },
      }))
    } else {
      setUiState((prevUiState) => ({
        ...prevUiState,
        lba: {
          ...prevUiState.lba,
          configure: {
            ...prevUiState.lba?.configure,
            aroundLatLng: undefined,
          },
        },
      }))
    }
  }

  return (
    <CustomAddressInput
      name="address"
      placeholder="À quel endroit ?"
      handleSearch={(search: string) => searchAddress(search)}
      renderItem={({ label }) => <>{label}</>}
      itemToString={({ label }) => label}
      onInputFieldChange={() => {}}
      onSelectItem={handleAddressSelect}
      onError={() => {}}
      allowHealFromError={false}
      renderNoResult={undefined}
      renderError={() => null}
    />
  )
}

export default function AlogliaPage() {
  return (
    <Box sx={{ padding: fr.spacing("3w") }}>
      {/* set insight to true when going in user-testing phase or production */}
      <InstantSearch
        searchClient={searchClient}
        indexName="lba"
        insights={false}
        routing={{
          router: history(),
          stateMapping: customStateMapping,
        }}
      >
        <Configure hitsPerPage={20} />
        <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w") }}>
          <CustomSearchBox />
          <AddressInputWithRouting />
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
