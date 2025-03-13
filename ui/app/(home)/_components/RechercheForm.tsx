"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { Formik, FormikProps } from "formik"
import { useMemo } from "react"
import { ZMetierEnrichi, type IMetierEnrichi } from "shared"
import { z } from "zod"
import { toFormikValidate } from "zod-formik-adapter"

import { AutocompleteAsync } from "@/app/(home)/_components/FormComponents/AutocompleteAsync"
import { SelectFormField } from "@/app/(home)/_components/FormComponents/SelectFormField"
import { searchAddress, zAddressItem } from "@/services/baseAdresse"
import { apiGet } from "@/utils/api.utils"
import { IRecherchePageParams } from "@/utils/routes.utils"

const zRomeSearchOption = z.object({
  item: ZMetierEnrichi,
  key: z.string(),
  label: z.string(),
  group: z.string(),
})

type IRomeSearchOption = z.output<typeof zRomeSearchOption>

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
    ...diplomes.slice(0, 4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Formations" })),
    ...metiers.slice(4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Autres Métiers" })),
    ...diplomes.slice(4).map((item: IMetierEnrichi) => ({ item, key: `${item.type}:${item.label}`, label: item.label, group: "Autres Formations" })),
  ]
}

type RechercheFormProps = {
  onSubmit: (result: IRecherchePageParams) => unknown
}

const schema = z.object({
  radius: z.string(),
  niveau: z.string(),
  metier: zRomeSearchOption,
  lieu: zAddressItem.nullable(),
})

type IFormType = z.output<typeof schema>

const validate = toFormikValidate(schema)

function RechercheFormComponent(props: FormikProps<IFormType>) {
  const hasError = useMemo(() => {
    return (
      Object.keys(props.touched)
        .map((key) => props.errors[key])
        .filter((error) => error).length > 0
    )
  }, [props.errors, props.touched])

  return (
    <Box
      component={"form"}
      onSubmit={props.handleSubmit}
      sx={{
        gap: fr.spacing("2w"),
        alignItems: "baseline",
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "1fr 1fr min-content 1fr min-content",
        },
      }}
    >
      <AutocompleteAsync
        noOptionsText="Nous ne parvenons pas à identifier le métier ou la formation que vous cherchez, veuillez reformuler votre recherche"
        id="metier"
        label="Métier ou formation *"
        fetchOptions={fetchRomeSearchOptions}
        getOptionKey={getOptionKey}
        getOptionLabel={getOptionLabel}
        groupBy={(option: IRomeSearchOption) => option.group}
        placeholder="Indiquer un métier ou une formation"
      />
      <AutocompleteAsync
        noOptionsText="Nous ne parvenons pas à identifier le lieu que vous cherchez, veuillez reformuler votre recherche"
        id="lieu"
        label="Lieu"
        fetchOptions={searchAddress}
        getOptionKey={(option) => option.label}
        getOptionLabel={(option) => option.label}
        placeholder="À quel endroit ?"
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
          id="radius"
          label="Rayon"
          style={{
            marginBottom: 0,
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
        id="niveau"
        label="Niveau d'études visé"
        style={{
          marginBottom: 0,
        }}
        options={[
          {
            value: "",
            label: "Indifférent",
            selected: true,
          },
          {
            value: "3 (CAP...)",
            label: "Cap, autres formations niveau 3",
          },
          {
            value: "4 (BAC...)",
            label: "Bac, autres formations niveau 4",
          },
          {
            value: "5 (BTS, DEUST...)",
            label: "BTS, DEUST, autres formations niveaux 5 (Bac+2)",
          },
          {
            value: "6 (Licence, BUT...)",
            label: "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
          },
          {
            value: "7 (Master, titre ingénieur...)",
            label: "Master, titre ingénieur, autres formations niveaux 7 ou 8 (Bac+5)",
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
          alignSelf: !hasError ? "end" : "center",
        }}
      >
        <Button iconPosition="left" iconId="fr-icon-search-line" type="submit" disabled={!props.isValid || props.isSubmitting}>
          C'est parti
        </Button>
      </Box>
    </Box>
  )
}

export function RechercheForm(props: RechercheFormProps) {
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
      <Formik<IFormType>
        initialValues={{
          radius: "30",
          niveau: "",
          metier: null,
          lieu: null,
        }}
        validate={validate}
        onSubmit={async (values) => {
          await props.onSubmit({
            romes: values.metier.item.romes.join(","),
            geo: values.lieu
              ? { address: values.lieu.label, latitude: values.lieu.value.coordinates[1], longitude: values.lieu.value.coordinates[0], radius: parseInt(values.radius) }
              : null,
            diploma: values.niveau || null,
            job_name: values.metier.label,
          })
        }}
        component={RechercheFormComponent}
      />
    </Box>
  )
}
