"use client"

import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Container, FormLabel, Grid, GridItem, Input, Link, Text } from "@chakra-ui/react"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { Formik, FormikProps } from "formik"
import { useState } from "react"

import { AutocompleteAsync } from "@/app/_components/FormComponents/AutocompleteAsync"
import { SelectFormField } from "@/app/_components/FormComponents/SelectFormField"
import {
  fetchLieuOptions,
  fetchRomeSearchOptions,
  getMetierOptionKey,
  getMetierOptionLabel,
  IFormType,
  IRomeSearchOption,
  niveauOptions,
  radiusOptions,
} from "@/app/_components/RechercheForm/RechercheForm"
import { baseUrl } from "@/config/config"

type IFormTypeWidget = IFormType & {
  job_name?: string
  opco?: string
  caller?: string
  scope: string
}

const scopeOptions = [
  {
    value: "/recherche",
    label: "Tout",
  },
  {
    value: "/recherche-emploi",
    label: "Emplois uniquement",
  },
  {
    value: "/recherche-formation",
    label: "Formations uniquement",
  },
]

const opcoOptions = [
  {
    value: "",
    label: "Indifférent",
  },
  {
    value: "AFDAS",
    label: "AFDAS",
  },
  {
    value: "AKTO",
    label: "AKTO",
  },
  {
    value: "ATLAS",
    label: "ATLAS",
  },
  {
    value: "CONSTRUCTYS",
    label: "CONSTRUCTYS",
  },
  {
    value: "OPCOMMERCE",
    label: "OPCOMMERCE",
  },
  {
    value: "OCAPIAT",
    label: "OCAPIAT",
  },
  {
    value: "OPCO2I",
    label: "OPCO2I",
  },
  {
    value: "EP",
    label: "EP",
  },
  {
    value: "MOBILITE",
    label: "MOBILITE",
  },
  {
    value: "SANTE",
    label: "SANTE",
  },
  {
    value: "UNIFORMATION",
    label: "UNIFORMATION",
  },
]

function WidgetFormComponent(props: FormikProps<IFormTypeWidget>) {
  return (
    <Box component={"form"} onSubmit={props.handleSubmit}>
      <Grid>
        <GridItem mt={4}>
          <AutocompleteAsync
            noOptionsText="Nous ne parvenons pas à identifier le métier ou la formation que vous cherchez, veuillez reformuler votre recherche"
            id="metier"
            key="metier"
            label="Métier ou formation * (pour renseigner le champ romes)"
            fetchOptions={fetchRomeSearchOptions}
            getOptionKey={getMetierOptionKey}
            getOptionLabel={getMetierOptionLabel}
            groupBy={(option: IRomeSearchOption) => option.group}
            placeholder="Indiquer un métier ou une formation"
            disabled={false}
          />
        </GridItem>
        <GridItem mt={4}>
          <AutocompleteAsync
            noOptionsText="Nous ne parvenons pas à identifier le lieu que vous cherchez, veuillez reformuler votre recherche"
            id="lieu"
            label="Lieu (pour renseigner lat et lon)"
            fetchOptions={fetchLieuOptions}
            getOptionKey={(option) => option.label}
            getOptionLabel={(option) => option.label}
            placeholder="À quel endroit ?"
            disabled={false}
          />
        </GridItem>
        <GridItem mt={4}>
          <SelectFormField
            id="radius"
            label="Rayon de recherche (radius)"
            style={{
              marginBottom: 0,
            }}
            options={radiusOptions.map((option) => ({ ...option, selected: option.value === props.values.radius }))}
            disabled={false}
          />
        </GridItem>
        <GridItem mt={4}>
          <SelectFormField
            id="niveau"
            label="Niveau d'études visé"
            style={{
              marginBottom: 0,
              textWrap: "nowrap",
            }}
            options={niveauOptions.map((option) => ({ ...option, selected: option.value === props.values.niveau }))}
            disabled={false}
          />
        </GridItem>
        <GridItem mt={4}>
          <SelectFormField
            id="scope"
            label="Périmètre (scope)"
            style={{
              marginBottom: 0,
              textWrap: "nowrap",
            }}
            options={scopeOptions.map((option) => ({ ...option, selected: option.value === props.values.niveau }))}
            disabled={false}
          />
        </GridItem>
        <GridItem mt={4}>
          <SelectFormField
            id="opco"
            label="Filtrage des opportunités d'emploi pour un OPCO. Optionnel (opco)"
            style={{
              marginBottom: 0,
              textWrap: "nowrap",
            }}
            options={opcoOptions.map((option) => ({ ...option, selected: option.value === props.values.opco }))}
            disabled={false}
          />
        </GridItem>
        <GridItem mt={4}>
          <FormLabel fontWeight={400} htmlFor="caller">
            Identifiant appelant (caller)
          </FormLabel>
          <Input onChange={props.handleChange} id="caller" name="caller" type="text" placeholder="ex: nom_site" />
        </GridItem>
        <GridItem mt={4}>
          <FormLabel fontWeight={400} htmlFor="job_name">
            Nom d'affichage du métier. Optionnel (job_name)
          </FormLabel>
          <Input onChange={props.handleChange} id="job_name" name="job_name" type="text" placeholder="Ex: Assistant ressources humaines" />
        </GridItem>
        <GridItem my={4}>
          <Button type="submit" title="Rafraîchir les widgets" disabled={false}>
            Rafraîchir les widgets
          </Button>
        </GridItem>
      </Grid>
    </Box>
  )
}

export function WidgetTester() {
  const initialValues = {
    radius: "30",
    niveau: "",
    metier: null,
    lieu: null,
    job_name: "",
    opco: "",
    scope: "/recherche",
    caller: "",
  }

  const [widgetUrl, setWidgetUrl] = useState(`${baseUrl}/recherche`)

  const getWidget = (params) => {
    return (
      <iframe
        title={params.title}
        style={{
          marginTop: "30px",
          marginBottom: "30px",
          height: `${params.height}px`,
          width: params.width ? `${params.width}px` : "100%",
        }}
        src={widgetUrl}
      />
    )
  }

  return (
    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Text as="h1" pl={6}>
        Test du Widget La bonne alternance
      </Text>
      <Text pl={6}>
        La documentation est ici :{" "}
        <Link
          href="https://mission-apprentissage.gitbook.io/la-bonne-alternance/documentation"
          aria-label="Accès à la documentation - nouvelle fenêtre"
          target="docIdea"
          isExternal
          fontSize={14}
          fontWeight={700}
          color="grey.425"
        >
          https://mission-apprentissage.gitbook.io/la-bonne-alternance/documentation <ExternalLinkIcon mx="2px" />
        </Link>
      </Text>
      <Formik<IFormTypeWidget>
        initialValues={initialValues}
        enableReinitialize
        validateOnBlur={false}
        onSubmit={async (values) => {
          let iFrameUrl = baseUrl
          iFrameUrl = iFrameUrl.replace("5", "3")

          const path = values.scope

          iFrameUrl = `${iFrameUrl}${path}`

          iFrameUrl += "?"
          iFrameUrl += values.caller ? `&caller=${encodeURIComponent(values.caller)}` : ""
          iFrameUrl += values.metier ? `&romes=${values.metier.romes}` : ""
          iFrameUrl += values.lieu ? `&lon=${values.lieu.longitude}&lat=${values.lieu.latitude}` : ""
          iFrameUrl += values.radius ? `&radius=${values.radius}` : ""
          iFrameUrl += values.opco ? `&opco=${encodeURIComponent(values.opco)}` : ""
          iFrameUrl += values.job_name ? `&job_name=${encodeURIComponent(values.job_name)}` : values?.metier?.label ? `&job_name=${values.metier.label}` : ""

          setWidgetUrl(iFrameUrl)
        }}
        component={WidgetFormComponent}
      />
      <Grid>
        <GridItem my={8}>
          URL associée à l&apos;attribut <Text as="strong">src</Text> de l&apos;iframe : <Text as="strong">{widgetUrl}</Text>
        </GridItem>
        <GridItem>
          <hr />
          <Text as="h3">Largeur 360 px - hauteur 640 px</Text>
          {getWidget({
            title: "mobile",
            height: 640,
            width: 360,
          })}
        </GridItem>
        <GridItem>
          <hr />
          <Text as="h3">Largeur 100% - hauteur 800 px</Text>
          {getWidget({
            title: "desktop",
            height: 800,
          })}
        </GridItem>
      </Grid>
    </Container>
  )
}
