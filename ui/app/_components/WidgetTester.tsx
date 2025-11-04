"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Typography, Stack, FormLabel, Input } from "@mui/material"
import type { FormikProps } from "formik"
import { Formik } from "formik"
import { useState } from "react"
import { OPCOS_LABEL } from "shared/constants/recruteur"

import { SelectFormField } from "./FormComponents/SelectFormField"
import type { IRechercheForm } from "./RechercheForm/RechercheForm"
import { rechercheFormToRechercheParams } from "./RechercheForm/RechercheForm"
import { RechercheLieuAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheNiveauSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { IRechercheMode } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
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
      <Stack spacing={2}>
        <RechercheMetierAutocomplete />
        <RechercheLieuAutocomplete />
        <RechercheRayonSelectFormik />
        <RechercheNiveauSelectFormik />
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
        <FormLabel htmlFor="caller">Identifiant appelant (caller)</FormLabel>
        <Input onChange={props.handleChange} id="caller" name="caller" type="text" placeholder="ex: nom_site" className={fr.cx("fr-input")} />
        <FormLabel htmlFor="job_name">Nom d'affichage du métier. Optionnel (job_name)</FormLabel>
        <Input onChange={props.handleChange} id="job_name" name="job_name" type="text" placeholder="Ex: Assistant ressources humaines" className={fr.cx("fr-input")} />
        <Button type="submit" title="Rafraîchir les widgets" disabled={false}>
          Rafraîchir les widgets
        </Button>
      </Stack>
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
    <Box sx={{ p: fr.spacing("3w"), backgroundColor: "#f8f8f8" }}>
      <Typography variant="h1" sx={{ mb: fr.spacing("2w") }}>
        Test du Widget La bonne alternance
      </Typography>
      <Typography sx={{ mb: fr.spacing("2w") }}>
        Lien vers la documentation détaillé :{" "}
        <DsfrLink href="https://www.data.gouv.fr/fr/dataservices/api-la-bonne-alternance/" aria-label="Accès à la documentation - nouvelle fenêtre" external={true}>
          https://www.data.gouv.fr/fr/dataservices/api-la-bonne-alternance/
        </DsfrLink>
      </Typography>
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
      <Box sx={{ p: fr.spacing("3w"), backgroundColor: fr.colors.decisions.background.altOverlap.grey.active, my: fr.spacing("3w") }}>
        <Typography sx={{ textAlign: "center" }}>
          URL associée à l&apos;attribut{" "}
          <Typography component={"span"} sx={{ fontWeight: 700 }}>
            src
          </Typography>{" "}
          de l&apos;iframe :<br />
          <br />
          <Typography component={"span"} sx={{ fontWeight: 700 }}>
            {widgetUrl}
          </Typography>
        </Typography>
      </Box>
      <hr />
      <Typography variant="h3">Largeur 360 px - hauteur 640 px</Typography>
      <WidgetIFrame title="mobile" height={640} width={360} url={widgetUrl} />
      <hr />
      <Typography variant="h3">Largeur 100% - hauteur 800 px</Typography>
      <WidgetIFrame title="desktop" height={800} url={widgetUrl} />
    </Box>
  )
}
