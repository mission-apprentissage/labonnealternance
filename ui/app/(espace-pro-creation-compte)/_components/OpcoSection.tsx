import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { FormikErrors, FormikTouched } from "formik"
import Image from "next/image"
import type { OPCOS_LABEL } from "shared/constants/recruteur"

import { FormSection } from "@/app/_components/FormSection"
import { OPCO_SHORT_LABELS, OpcoSelect } from "@/app/(espace-pro)/_components/OpcoSelect"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import { infosOpcos } from "@/theme/components/logos/infos-opcos"

/**
 * Section OPCO de la création de compte entreprise. Isolée pour accueillir la suggestion d'OPCO (#5455)
 * sans toucher à la mise en page du formulaire.
 * - `detectedOpco` : OPCO identifié automatiquement, affiché en lecture seule ;
 * - sinon, select obligatoire (valeur `value`), et encart de l'OPCO choisi sous le select.
 */
export const OpcoSection = ({
  title,
  detectedOpco,
  name,
  value,
  onChange,
  errors,
  touched,
}: {
  title: string
  detectedOpco?: OPCOS_LABEL
  name: string
  value: OPCOS_LABEL | ""
  onChange: (value: OPCOS_LABEL) => void
  errors: FormikErrors<any>
  touched: FormikTouched<any>
}) => {
  return (
    <FormSection title={title}>
      <Typography sx={{ mb: fr.spacing("6v") }}>
        Chaque entreprise est rattachée à un OPCO. C'est votre acteur de référence pour vous accompagner dans vos démarches liées à l'alternance (financement des contrats,
        formation…). Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.
      </Typography>
      {detectedOpco ? (
        <>
          <OpcoCard opco={detectedOpco} />
          <Box component="p" className={fr.cx("fr-message", "fr-message--info")} sx={{ mt: `${fr.spacing("3v")} !important`, mb: 0 }}>
            <span>
              Votre OPCO a été identifié automatiquement à partir des données France compétences. S'il est erroné,{" "}
              <DsfrLink href={`mailto:${publicConfig.publicEmail}?subject=${encodeURIComponent("Espace pro - OPCO erroné")}`} external>
                contactez le support de La bonne alternance
              </DsfrLink>
              .
            </span>
          </Box>
        </>
      ) : (
        <>
          <OpcoSelect
            name={name}
            value={value as OPCOS_LABEL}
            onChange={onChange}
            errors={errors}
            touched={touched}
            label="OPCO de votre entreprise"
            hint="Vous ne le connaissez pas ? Votre service RH ou votre expert-comptable peut vous l'indiquer."
            infoMessage={
              // un seul enfant : .fr-message est en flex, chaque nœud deviendrait une colonne
              <span>
                <b>Vérifiez cette information</b> : après la création du compte, seul le support de La bonne alternance peut la modifier.
              </span>
            }
          />
          <div aria-live="polite">{value && <OpcoCard opco={value} />}</div>
        </>
      )}
    </FormSection>
  )
}

const OpcoCard = ({ opco }: { opco: OPCOS_LABEL }) => {
  const infos = infosOpcos.find((x) => x.nom === opco)
  if (!infos) return null

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: `${fr.spacing("4v")} ${fr.spacing("6v")}`,
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        p: `${fr.spacing("5v")} ${fr.spacing("6v")}`,
        mt: fr.spacing("2v"),
      }}
    >
      <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
        <Typography component="h3" sx={{ fontWeight: 700, fontSize: "20px !important", lineHeight: "28px !important", mb: `${fr.spacing("2v")} !important` }}>
          Votre OPCO : {OPCO_SHORT_LABELS[opco] ?? opco}
        </Typography>
        <Typography sx={{ fontSize: "14px", lineHeight: "24px" }}>{infos.description}</Typography>
      </Box>
      <Image src={infos.image} alt="" width={118} style={{ height: "auto", backgroundColor: "#fff" }} />
    </Box>
  )
}
