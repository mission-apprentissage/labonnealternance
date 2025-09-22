"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Typography, FormControl, FormLabel, Select, MenuItem, Input, SelectChangeEvent } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import { history } from "instantsearch.js/es/lib/routers"
import React, { useState, useEffect } from "react"
import { InstantSearch, Highlight, useInstantSearch, useConfigure, useStats, Hits } from "react-instantsearch"

import CustomAddressInput from "@/app/(algolia)/_components/CustomAddressInput"
import { CustomPagination } from "@/app/(algolia)/_components/CustomPagination"
import { CustomRefinementList } from "@/app/(algolia)/_components/CustomRefinementList"
import { CustomSearchBox } from "@/app/(algolia)/_components/CustomSearchBox"
import { CardStyling } from "@/app/(candidat)/recherche/_components/RechercheResultats/CardStyling"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { publicConfig } from "@/config.public"
import { searchAddress } from "@/services/baseAdresse"

const { algoliaApiKey, algoliaAppId } = publicConfig

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey)

// Custom state to store radius outside of InstantSearch but sync with URL
let globalRadius = 30_000

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

function HitCard({ hit }: { hit: any }) {
  return (
    <Box>
      <CardStyling>
        <Card
          background
          style={{ paddingBottom: fr.spacing("1v") }}
          border
          // enlargeLink
          horizontal
          // linkProps={{
          //   href: "itemUrl",
          //   prefetch: false,
          // }}
          start={hit.type === "formation" ? <TagFormation /> : <TagOffreEmploi />}
          title={
            <Typography
              component="span"
              className={fr.cx("fr-text--bold", "fr-text--md")}
              sx={{
                color: fr.colors.decisions.text.actionHigh.grey.default,
              }}
            >
              <Highlight attribute="title" hit={hit} />
            </Typography>
          }
          desc={
            <Box
              component="span"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: fr.spacing("3v"),
              }}
            >
              <Typography component="span" className={fr.cx("fr-text--sm")} color={fr.colors.decisions.text.actionHigh.grey.default}>
                {hit.organiztion_name}
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: fr.colors.decisions.text.title.grey.default,
                }}
                className={fr.cx("fr-text--xs")}
              >
                {hit.address}
              </Typography>
            </Box>
          }
          shadow
          size="medium"
        />
      </CardStyling>
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
      },
    }))
  }

  return (
    <FormControl sx={{ minWidth: 120 }}>
      <FormLabel>Rayon</FormLabel>
      <Select value={currentRadius.toString()} onChange={handleRadiusChange} input={<Input className={fr.cx("fr-input")} />} size="small">
        <MenuItem value={10_000}>10 km</MenuItem>
        <MenuItem value={30_000}>30 km</MenuItem>
        <MenuItem value={60_000}>60 km</MenuItem>
        <MenuItem value={100_000}>100 km</MenuItem>
      </Select>
    </FormControl>
  )
}

function PublicationDateSelect() {
  const { setUiState } = useInstantSearch()

  const handleChange = (e: SelectChangeEvent) => {
    const now = Date.now()
    let minDate

    switch (e.target.value) {
      case "24h":
        minDate = now - 24 * 60 * 60 * 1000
        break
      case "3d":
        minDate = now - 3 * 24 * 60 * 60 * 1000
        break
      case "1w":
        minDate = now - 7 * 24 * 60 * 60 * 1000
        break
      case "1m":
        minDate = now - 30 * 24 * 60 * 60 * 1000
        break
      default:
        minDate = null
    }

    setUiState((uiState) => ({
      ...uiState,
      lba: {
        ...uiState.lba,
        configure: {
          ...uiState.lba?.configure,
          filters: minDate ? `offer_creation >= ${Math.floor(minDate / 1000)}` : undefined,
        },
      },
    }))
  }

  return (
    <FormControl sx={{ minWidth: 160 }}>
      <FormLabel>Date de publication</FormLabel>
      <Select onChange={handleChange} input={<Input className={fr.cx("fr-input")} />} size="small">
        <MenuItem value={"24h"}>Aujourd'hui</MenuItem>
        <MenuItem value={"3d"}>3 derniers jours</MenuItem>
        <MenuItem value={"1w"}>Semaine précédente</MenuItem>
        <MenuItem value={"1m"}>30 jours précédent</MenuItem>
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

const SearchStats = () => {
  const { nbHits } = useStats()

  return (
    <Box sx={{ my: fr.spacing("3w") }}>
      <Typography variant="h6">{nbHits} résultats</Typography>
    </Box>
  )
}

export default function AlogliaPage() {
  return (
    <Box sx={{ my: fr.spacing("3w") }}>
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
        <Box sx={{}}>
          <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w"), px: fr.spacing("3w") }}>
            <CustomSearchBox />
            <AddressInputWithRouting />
            <RadiusSelect />
            <PublicationDateSelect />
          </Box>
          <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w"), px: fr.spacing("3w"), flexWrap: "wrap" }}>
            <CustomRefinementList attribute="type" title="Type" />
            <CustomRefinementList attribute="level" title="Niveau" />
            <CustomRefinementList attribute="sub_type" title="Partenaire" />
            <CustomRefinementList attribute="organization_name" title="Entreprise" />
            <CustomRefinementList attribute="contract_type" title="Type de contrat" />
            <CustomRefinementList attribute="activity_sector" title="Secteur d'activité" />
            <CustomRefinementList attribute="smart_apply" title="Candidatures simplifiées" />
          </Box>
        </Box>
        <Box sx={{ backgroundColor: "#f6f6f6", px: fr.spacing("3w"), py: fr.spacing("2w") }}>
          <Box sx={{ px: fr.spacing("3w") }}>
            <SearchStats />
          </Box>
          <Hits hitComponent={HitCard} />
          <CustomPagination />
        </Box>
      </InstantSearch>
    </Box>
  )
}
