"use client"

import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Container, FormLabel, Grid, GridItem, Input, Link, Text } from "@chakra-ui/react"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { Formik, FormikProps } from "formik"
import { useState } from "react"
import { OPCOS_LABEL } from "shared/constants/recruteur"

import { RechercheLieuAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheNiveauSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { IRechercheMode } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { SelectFormField } from "@/app/_components/FormComponents/SelectFormField"
import { IRechercheForm, rechercheFormToRechercheParams } from "@/app/_components/RechercheForm/RechercheForm"
import { baseUrl } from "@/config/config"
import { PAGES } from "@/utils/routes.utils"

type IFormTypeWidget = IRechercheForm & {
  job_name?: string
  opco?: string
  caller?: string
  scope: IRechercheMode
}

const scopeOptions = [
  {
    value: IRechercheMode.DEFAULT,
    label: "Tout",
  },
  {
    value: IRechercheMode.JOBS_ONLY,
    label: "Emplois uniquement",
  },
  {
    value: IRechercheMode.FORMATIONS_ONLY,
    label: "Formations uniquement",
  },
]

const validOpcos = Object.values(OPCOS_LABEL).filter((value) => value !== OPCOS_LABEL.UNKNOWN_OPCO)

function WidgetFormComponent(props: FormikProps<IFormTypeWidget>) {
  return (
    <Box component={"form"} onSubmit={props.handleSubmit}>
      <Grid>
        <GridItem mt={4}>
          <RechercheMetierAutocomplete />
        </GridItem>
        <GridItem mt={4}>
          <RechercheLieuAutocomplete />
        </GridItem>
        <GridItem mt={4}>
          <RechercheRayonSelectFormik />
        </GridItem>
        <GridItem mt={4}>
          <RechercheNiveauSelectFormik />
        </GridItem>
        <GridItem mt={4}>
          <SelectFormField
            id="scope"
            label="Périmètre (scope)"
            style={{
              marginBottom: 0,
              textWrap: "nowrap",
            }}
            options={scopeOptions.map((option) => ({ ...option, selected: option.value === props.values.scope }))}
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
            options={validOpcos.map((opco) => ({ value: opco, label: opco, selected: opco === props.values.opco }))}
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

const WidgetIFrame = ({ title, width, height, url }: { title: string; width?: number; height: number; url: string }) => {
  return (
    <iframe
      title={title}
      style={{
        marginTop: "30px",
        marginBottom: "30px",
        height: `${height}px`,
        width: width ? `${width}px` : "100%",
      }}
      src={url}
    />
  )
}

export function WidgetTester() {
  const initialValues: IFormTypeWidget = {
    radius: "30",
    diploma: null,
    metier: null,
    lieu: null,
    job_name: "",
    opco: "",
    scope: IRechercheMode.DEFAULT,
    caller: "",
  }

  const [widgetUrl, setWidgetUrl] = useState(`${baseUrl}/recherche`)

  return (
    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Text as="h1" pl={6}>
        Test du Widget La bonne alternance
      </Text>
      <Text pl={6}>
        La documentation est ici :{" "}
        <Link
          href="https://www.data.gouv.fr/fr/dataservices/api-la-bonne-alternance/"
          aria-label="Accès à la documentation - nouvelle fenêtre"
          target="docIdea"
          isExternal
          fontSize={14}
          fontWeight={700}
          color="grey.425"
        >
          https://www.data.gouv.fr/fr/dataservices/api-la-bonne-alternance/ <ExternalLinkIcon mx="2px" />
        </Link>
      </Text>
      <Formik<IFormTypeWidget>
        initialValues={initialValues}
        enableReinitialize
        validateOnBlur={false}
        onSubmit={async (values) => {
          const { job_name, opco, caller, scope, metier } = values
          const rechercheParams = rechercheFormToRechercheParams(values)
          const path = PAGES.dynamic.genericRecherche({ rechercheParams: rechercheParams, mode: scope }).getPath()

          const url = new URL(`${baseUrl}${path}`)
          const searchParams = url.searchParams
          if (caller) {
            searchParams.append("caller", caller)
          }
          if (opco) {
            searchParams.append("opco", opco)
          }
          if (job_name) {
            searchParams.append("job_name", job_name)
          } else if (metier?.label) {
            searchParams.append("job_name", metier.label)
          }
          setWidgetUrl(url.toString())
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
          <WidgetIFrame title="mobile" height={640} width={360} url={widgetUrl} />
        </GridItem>
        <GridItem>
          <hr />
          <Text as="h3">Largeur 100% - hauteur 800 px</Text>
          <WidgetIFrame title="desktop" height={800} url={widgetUrl} />
        </GridItem>
      </Grid>
    </Container>
  )
}
