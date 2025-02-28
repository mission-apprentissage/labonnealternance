"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import type { IMetierEnrichi } from "shared"

import { AutocompleteSelectAsync } from "@/app/(home)/home/_components/FormComponents/AutocompleteSelectAsync"
import { SelectFormField } from "@/app/(home)/home/_components/FormComponents/SelectFormField"
import { apiGet } from "@/utils/api.utils"

import { InputFormField } from "./FormComponents/InputFormField"

type IRomeSearchOption = {
  item: IMetierEnrichi
  key: string
  label: string
  group: string
}

function getOptionKey(option: IRomeSearchOption) {
  return option.key
}

function getOptionLabel(option: IRomeSearchOption) {
  return option.label
}

async function fetchRomeSearchOptions(query: string): Promise<IRomeSearchOption[]> {
  const data = await apiGet("/rome", { querystring: { title: query } })

  const metiers: IMetierEnrichi[] = data.labelsAndRomes ?? []
  const diplomes: IMetierEnrichi[] = data.labelsAndRomesForDiplomas ?? []

  return [
    ...metiers.slice(0, 4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Métiers" })),
    ...diplomes.slice(0, 4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Diplômes" })),
    ...metiers.slice(4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Autres Métiers" })),
    ...diplomes.slice(4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Autres Diplômes" })),
  ]
}

export function RechercheForm() {
  return (
    <Box
      sx={{
        padding: fr.spacing("4w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        borderRadius: fr.spacing("1w"),
        boxShadow: "0px 2px 6px 0px #00001229",
      }}
    >
      <Typography variant="h2">
        Se former et travailler{" "}
        <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          en alternance
        </Box>
      </Typography>
      <Box
        component="form"
        sx={{
          gap: fr.spacing("2w"),
          alignItems: "flex-end",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr 1fr min-content 1fr min-content",
          },
        }}
      >
        <AutocompleteSelectAsync
          onChange={async (e) => {
            console.log(e)
          }}
          noOptionsText="Nous ne parvenons pas à identifier le métier que vous cherchez, veuillez reformuler votre recherche"
          id="metier"
          label="Métier ou diplôme"
          fetchOptions={fetchRomeSearchOptions}
          getOptionKey={getOptionKey}
          getOptionLabel={getOptionLabel}
          groupBy={(option: IRomeSearchOption) => option.group}
          placeholder="Indiquer un métier ou un diplôme"
        />
        {/* <InputFormField
          label="Métier ou diplôme"
          style={{
            marginBottom: 0,
          }}
          nativeInputProps={{
            placeholder: "Indiquer un métier ou un diplôme",
          }}
        /> */}
        <InputFormField
          label="Lieu"
          style={{
            marginBottom: 0,
          }}
          nativeInputProps={{
            placeholder: "À quel endroit ?",
          }}
        />
        <Box
          sx={{
            width: {
              xs: "100%",
              lg: "120px",
            },
          }}
        >
          <SelectFormField
            label="Rayon"
            style={{
              marginBottom: 0,
            }}
            nativeSelectProps={{
              name: "rayon",
            }}
            options={[
              {
                value: "10",
                label: "10 km",
              },
              {
                value: "30",
                label: "30 km",
                selected: true,
              },
              {
                value: "60",
                label: "60 km",
              },
              {
                value: "100",
                label: "100 km",
              },
            ]}
          />
        </Box>
        <SelectFormField
          label="Niveau d'études visé"
          style={{
            marginBottom: 0,
          }}
          nativeSelectProps={{
            name: "niveau",
          }}
          options={[
            {
              value: "10",
              label: "10 km",
            },
            {
              value: "30",
              label: "30 km",
              selected: true,
            },
            {
              value: "60",
              label: "60 km",
            },
            {
              value: "100",
              label: "100 km",
            },
          ]}
        />
        <Box
          sx={{
            whiteSpace: "nowrap",
            py: {
              xs: fr.spacing("2w"),
              lg: 0,
            },
          }}
        >
          <Button iconPosition="left" iconId="fr-icon-search-line">
            C'est parti
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
