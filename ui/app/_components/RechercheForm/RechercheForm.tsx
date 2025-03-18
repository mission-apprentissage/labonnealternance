"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button, ButtonProps } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { Formik, FormikProps } from "formik"
import { createContext, useContext, useMemo } from "react"
import { type IMetierEnrichi } from "shared"
import { z } from "zod"
import { toFormikValidate } from "zod-formik-adapter"

import { AutocompleteAsync } from "@/app/_components/FormComponents/AutocompleteAsync"
import { SelectFormField } from "@/app/_components/FormComponents/SelectFormField"
import { searchAddress } from "@/services/baseAdresse"
import { apiGet } from "@/utils/api.utils"
import { IRecherchePageParams } from "@/utils/routes.utils"

const schema = z.object({
  radius: z.string(),
  niveau: z.string(),
  metier: z.object({
    type: z.string(),
    label: z.string(),
    romes: z.array(z.string()),
  }),
  lieu: z
    .object({
      label: z.string(),
      longitude: z.number(),
      latitude: z.number(),
    })
    .nullable(),
})

type IFormType = z.output<typeof schema>

const niveauOptions = [
  {
    value: "",
    label: "Indifférent",
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
] as const satisfies Array<{ value: IFormType["niveau"]; label: string; selected?: boolean }>

const radiusOptions = [
  {
    value: "10",
    label: "10 km",
  },
  {
    value: "30",
    label: "30 km",
  },
  {
    value: "60",
    label: "60 km",
  },
  {
    value: "100",
    label: "100 km",
  },
] as const satisfies Array<{ value: IFormType["radius"]; label: string; selected?: boolean }>

type RechercheFormProps = {
  type: "home" | "recherche"
  initialValue?: Pick<IRecherchePageParams, "romes" | "diploma" | "job_name" | "geo" | "job_type"> | null
  onSubmit: (result: Pick<IRecherchePageParams, "romes" | "diploma" | "job_name" | "geo" | "job_type" | "selection">) => unknown
}

type IRomeSearchOption = IFormType["metier"] & { group?: string }

function getMetierOptionKey(option: IRomeSearchOption) {
  return `${option.type}:${option.label}`
}

function getMetierOptionLabel(option: IRomeSearchOption) {
  return option.label
}

async function fetchRomeSearchOptions(query: string): Promise<IRomeSearchOption[]> {
  const data = await apiGet("/rome", { querystring: { title: query } })

  const metiers: IMetierEnrichi[] = data.labelsAndRomes ?? []
  const diplomes: IMetierEnrichi[] = data.labelsAndRomesForDiplomas ?? []

  return [
    ...metiers.slice(0, 4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Métiers" })),
    ...diplomes.slice(0, 4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Formations" })),
    ...metiers.slice(4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Autres Métiers" })),
    ...diplomes.slice(4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Autres Formations" })),
  ]
}

async function fetchLieuOptions(query: string): Promise<IFormType["lieu"][]> {
  const data = await searchAddress(query)

  return data.map((item) => ({
    label: item.label,
    longitude: item.value.coordinates[0],
    latitude: item.value.coordinates[1],
  }))
}

const validate = toFormikValidate(schema)

const RechercheFormContext = createContext<RechercheFormProps["type"]>("home")

function RechercheFormButton(props: { disabled: boolean; hasError: boolean; type: RechercheFormProps["type"] }) {
  const { disabled, hasError, type } = props

  const buttonProps = {
    iconId: "fr-icon-search-line",
    type: "submit",
    disabled,
  } as const satisfies Omit<ButtonProps, "children">

  const buttonContainerSx = {
    whiteSpace: "nowrap",
    py: {
      xs: fr.spacing("2w"),
      lg: "1px",
    },
    alignSelf: !hasError ? "end" : "center",
    '& button[type="submit"]': {
      justifyContent: {
        xs: "center",
        lg: "start",
      },
      width: {
        xs: "100%",
        lg: "auto",
      },
    },
  }

  return (
    <>
      <Box
        sx={{
          display:
            type === "home"
              ? "block"
              : {
                  xs: "block",
                  lg: "none",
                },
          ...buttonContainerSx,
        }}
      >
        <Button iconPosition="left" {...buttonProps}>
          C'est parti
        </Button>
      </Box>
      {type === "recherche" ? (
        <Box
          sx={{
            display: {
              xs: "none",
              lg: "block",
            },
            ...buttonContainerSx,
          }}
        >
          <Button title="C'est parti" {...buttonProps} />
        </Box>
      ) : null}
    </>
  )
}

function RechercheFormComponent(props: FormikProps<IFormType>) {
  const type = useContext(RechercheFormContext)

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
        key="metier"
        label="Métier ou formation *"
        fetchOptions={fetchRomeSearchOptions}
        getOptionKey={getMetierOptionKey}
        getOptionLabel={getMetierOptionLabel}
        groupBy={(option: IRomeSearchOption) => option.group}
        placeholder="Indiquer un métier ou une formation"
      />
      <AutocompleteAsync
        noOptionsText="Nous ne parvenons pas à identifier le lieu que vous cherchez, veuillez reformuler votre recherche"
        id="lieu"
        label="Lieu"
        fetchOptions={fetchLieuOptions}
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
          options={radiusOptions.map((option) => ({ ...option, selected: option.value === props.values.radius }))}
        />
      </Box>
      <SelectFormField
        id="niveau"
        label="Niveau d'études visé"
        style={{
          marginBottom: 0,
        }}
        options={niveauOptions.map((option) => ({ ...option, selected: option.value === props.values.niveau }))}
      />
      <RechercheFormButton disabled={!props.isValid || props.isSubmitting} hasError={hasError} type={type} />
    </Box>
  )
}

export function RechercheForm(props: RechercheFormProps) {
  const initialValues: IFormType = useMemo((): IFormType => {
    return {
      radius: props.initialValue?.geo?.radius.toString() ?? "30",
      niveau: props.initialValue?.diploma ?? "",
      metier:
        props.initialValue?.romes == null
          ? null
          : {
              label: props.initialValue.job_name ?? "",
              romes: props.initialValue.romes,
              type: props.initialValue.job_type ?? "job",
            },
      lieu:
        props.initialValue?.geo == null
          ? null
          : {
              label: props.initialValue.geo.address ?? "",
              latitude: props.initialValue.geo.latitude,
              longitude: props.initialValue.geo.longitude,
            },
    }
  }, [props.initialValue?.geo, props.initialValue?.diploma, props.initialValue?.job_name, props.initialValue?.job_type, props.initialValue?.romes])

  return (
    <RechercheFormContext.Provider value={props.type}>
      <Formik<IFormType>
        initialValues={initialValues}
        enableReinitialize
        validate={validate}
        onSubmit={async (values) => {
          await props.onSubmit({
            romes: values.metier.romes,
            geo: values.lieu ? { address: values.lieu.label, latitude: values.lieu.latitude, longitude: values.lieu.longitude, radius: parseInt(values.radius) } : null,
            diploma: values.niveau || null,
            job_name: values.metier.label,
            job_type: values.metier.type,
            selection: [],
          })
        }}
        component={RechercheFormComponent}
      />
    </RechercheFormContext.Provider>
  )
}
