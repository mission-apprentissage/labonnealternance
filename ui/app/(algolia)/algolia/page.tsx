"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography, FormControl, FormLabel, Select, MenuItem, Input, SelectChangeEvent } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import { history } from "instantsearch.js/es/lib/routers"
import React, { useState, useEffect } from "react"
import { InstantSearch, Hits, Highlight, useInstantSearch, useConfigure } from "react-instantsearch"

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

// Custom state to store radius outside of InstantSearch but sync with URL
let globalRadius = 30

const customStateMapping = {
  stateToRoute(uiState: any) {
    const indexUiState = uiState.lba || {}
    const route: any = {
      q: indexUiState.query,
      type: indexUiState.refinementList?.type,
      level: indexUiState.refinementList?.level,
      sub_type: indexUiState.refinementList?.sub_type,
      organization_name: indexUiState.refinementList?.organization_name,
      page: indexUiState.page,
      coordinates: indexUiState.configure?.aroundLatLng,
      radius: globalRadius,
    }
    return route
  },
  routeToState(routeState: any) {
    // Update global radius from URL
    if (routeState.radius) {
      globalRadius = Number(routeState.radius)
    }
    return {
      lba: {
        query: routeState.q,
        page: routeState.page,
        refinementList: {
          type: routeState.type,
          level: routeState.level,
          sub_type: routeState.sub_type,
          organization_name: routeState.organization_name,
        },
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

function RadiusSelect() {
  const { setUiState } = useInstantSearch()
  const [currentRadius, setCurrentRadius] = useState(globalRadius)

  // Sync with global radius changes (from URL)
  useEffect(() => {
    setCurrentRadius(globalRadius)
  }, [])

  const handleRadiusChange = (event: SelectChangeEvent) => {
    const radius = Number(event.target.value)
    globalRadius = radius
    setCurrentRadius(radius)

    // Trigger InstantSearch routing update by setting any UI state
    setUiState((prevUiState) => ({
      ...prevUiState,
      lba: {
        ...prevUiState.lba,
        // Force a state change to trigger routing
        page: 1,
      },
    }))
  }

  return (
    <FormControl sx={{ minWidth: 120 }}>
      <FormLabel>Rayon</FormLabel>
      <Select value={currentRadius.toString()} onChange={handleRadiusChange} input={<Input className={fr.cx("fr-input")} />} size="small">
        <MenuItem value={10}>10 km</MenuItem>
        <MenuItem value={30}>30 km</MenuItem>
        <MenuItem value={60}>60 km</MenuItem>
        <MenuItem value={100}>100 km</MenuItem>
      </Select>
    </FormControl>
  )
}

function DynamicConfigure() {
  const { uiState } = useInstantSearch()
  const coordinates = uiState.lba?.configure?.aroundLatLng

  useConfigure({
    hitsPerPage: 20,
    ...(coordinates && { aroundLatLng: coordinates }),
    aroundRadius: globalRadius,
  })

  return null
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
        <DynamicConfigure />
        <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w") }}>
          <CustomSearchBox />
          <AddressInputWithRouting />
          <RadiusSelect />
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
