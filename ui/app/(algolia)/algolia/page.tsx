"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Typography, FormControl, FormLabel, Select, MenuItem, Input, SelectChangeEvent } from "@mui/material"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import { history } from "instantsearch.js/es/lib/routers"
import React, { useState, useEffect, useMemo } from "react"
import { InstantSearch, Highlight, useInstantSearch, useConfigure, useStats, Hits } from "react-instantsearch"

import CustomAddressInput from "@/app/(algolia)/_components/CustomAddressInput"
import { CustomPagination } from "@/app/(algolia)/_components/CustomPagination"
import { CustomRefinementList } from "@/app/(algolia)/_components/CustomRefinementList"
import { CustomSearchBoxWithSuggestions } from "@/app/(algolia)/_components/CustomSearchBoxWithSuggestions"
import { CardStyling } from "@/app/(candidat)/recherche/_components/RechercheResultats/CardStyling"
import { useResultItemUrlAlgolia } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
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
      type_filter_label: indexUiState.refinementList?.type_filter_label,
      organization_name: indexUiState.refinementList?.organization_name,
      activity_sector: indexUiState.refinementList?.activity_sector,
      contract_type: indexUiState.refinementList?.contract_type,
      smart_apply: indexUiState.refinementList?.smart_apply,
      page: indexUiState.page,
      coordinates: indexUiState.configure?.aroundLatLng,
      radius: globalRadius,
      publication_filter: indexUiState.configure?.filters && indexUiState.configure.filters.includes("publication_date >=") ? indexUiState.configure.filters : undefined,
    }
    return route
  },
  routeToState(routeState: any) {
    // Update global radius from URL
    if (routeState.radius) {
      globalRadius = Number(routeState.radius)
    }

    const state = {
      lba: {
        query: routeState.q,
        page: routeState.page,
        refinementList: {
          type: routeState.type,
          level: routeState.level,
          sub_type: routeState.sub_type,
          organization_name: routeState.organization_name,
          activity_sector: routeState.activity_sector,
          contract_type: routeState.contract_type,
          type_filter_label: routeState.type_filter_label,
          smart_apply: routeState.smart_apply,
        },
        configure: {
          ...(routeState.coordinates && { aroundLatLng: routeState.coordinates }),
          ...(routeState.publication_filter && { filters: routeState.publication_filter }),
        },
      },
    }

    return state
  },
}

function HitCard({ hit }: { hit: any }) {
  // @ts-ignore
  const itemUrl = useResultItemUrlAlgolia({ id: hit.url_id, ideaType: hit.sub_type })
  return (
    <Box>
      <CardStyling>
        <Card
          background
          style={{ paddingBottom: fr.spacing("1v") }}
          border
          enlargeLink
          horizontal
          linkProps={{
            href: itemUrl,
            prefetch: false,
          }}
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
              {hit.application_count && hit.application_count > 0 ? (
                <Typography
                  component="span"
                  sx={{
                    whiteSpace: "nowrap",
                    color: fr.colors.decisions.text.default.info.default,
                    py: fr.spacing("1v"),
                  }}
                  className={fr.cx("fr-text--xs", "fr-text--bold", "fr-icon-flashlight-fill", "fr-icon--sm")}
                >
                  {`${hit.application_count} CANDIDATURE${hit.application_count > 1 ? "S" : ""}`}
                </Typography>
              ) : null}
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
  const [selectedFilter, setSelectedFilter] = useState("")

  const filterOptions = useMemo(() => {
    const now = Date.now()
    return [
      { value: "", label: "Toutes", filters: "" },
      { value: "24h", label: "Aujourd'hui", filters: `publication_date >= ${now - 24 * 60 * 60 * 1000}` },
      { value: "3d", label: "3 derniers jours", filters: `publication_date >= ${now - 3 * 24 * 60 * 60 * 1000}` },
      { value: "1w", label: "Semaine précédente", filters: `publication_date >= ${now - 7 * 24 * 60 * 60 * 1000}` },
      { value: "1m", label: "30 jours précédent", filters: `publication_date >= ${now - 30 * 24 * 60 * 60 * 1000}` },
    ]
  }, [])

  const handleChange = (e: SelectChangeEvent) => {
    const value = e.target.value
    setSelectedFilter(value)
  }

  // Use a separate component to apply the filter
  return (
    <>
      <FormControl sx={{ minWidth: 160 }}>
        <FormLabel>Date de publication</FormLabel>
        <Select value={selectedFilter} onChange={handleChange} input={<Input className={fr.cx("fr-input")} />} size="small">
          {filterOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <PublicationDateFilter selectedFilter={selectedFilter} filterOptions={filterOptions} />
    </>
  )
}

function PublicationDateFilter({ selectedFilter, filterOptions }: { selectedFilter: string; filterOptions: Array<{ value: string; label: string; filters: string }> }) {
  const option = filterOptions.find((opt) => opt.value === selectedFilter)

  useConfigure({
    filters: option?.filters || "",
  })

  return null
}

function DynamicConfigure() {
  const { uiState } = useInstantSearch()
  const coordinates = uiState.lba?.configure?.aroundLatLng

  const configureOptions = {
    hitsPerPage: 20,
    ...(coordinates && { aroundLatLng: coordinates }),
    aroundRadius: globalRadius,
    // Don't set filters here - let them be managed by individual components
  }

  useConfigure(configureOptions)

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
        insights={true}
        routing={{
          router: history(),
          stateMapping: customStateMapping,
        }}
        // future={{ preserveSharedStateOnUnmount: true }}
      >
        <DynamicConfigure />
        <Box sx={{}}>
          <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w"), px: fr.spacing("3w") }}>
            <CustomSearchBoxWithSuggestions />
            <AddressInputWithRouting />
            <RadiusSelect />
            <PublicationDateSelect />
          </Box>
          <Box sx={{ display: "flex", gap: fr.spacing("2w"), marginBottom: fr.spacing("3w"), px: fr.spacing("3w"), flexWrap: "wrap" }}>
            <CustomRefinementList attribute="type" title="Type" />
            <CustomRefinementList attribute="level" title="Niveau" />
            <CustomRefinementList attribute="type_filter_label" title="Partenaire" />
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
