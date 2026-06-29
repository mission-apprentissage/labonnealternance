"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Select } from "@codegouvfr/react-dsfr/Select"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useMemo, useState } from "react"
import type { ILbaCompanyForAdminSearchJSON, ILbaCompanySearchField } from "shared/routes/updateLbaCompany.routes"
import * as Yup from "yup"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomInput from "@/app/_components/CustomInput"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { phoneValidation } from "@/common/validation/fieldValidations"
import { getCompanyContactInfo, putCompanyContactInfo, searchLbaCompanies } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { getLbaCompaniesColumns } from "../_utils/lbaCompaniesColumns"

const unreferencedLbaRecruteurWarning = "Seules les modifications / ajouts sont supportés dans le cas d'une société déréférencée"

const SEARCH_FIELD_OPTIONS: { value: ILbaCompanySearchField; label: string }[] = [
  { value: "workplace_legal_name", label: "Raison sociale" },
  { value: "workplace_brand", label: "Enseigne" },
  { value: "apply_email", label: "Email de contact" },
  { value: "apply_phone", label: "Téléphone" },
  { value: "workplace_siret", label: "SIRET" },
]

function FormulaireModificationEntreprise({ siret }: { siret: string }) {
  const {
    isLoading,
    data,
    error: readError,
    refetch,
  } = useQuery({
    queryKey: ["getCompany", siret],

    queryFn: () => {
      setHasUpdated(false)
      return getCompanyContactInfo(siret)
    },

    enabled: Boolean(siret),
    retry: false,
  })
  const [hasUpdated, setHasUpdated] = useState(false)
  const updateEntreprise = useMutation({
    mutationKey: ["updateEntreprise"],
    mutationFn: ({ phone, email }: { phone: string; email: string }) => putCompanyContactInfo({ phone, email, siret }),

    onSuccess: () => {
      refetch()
      setHasUpdated(true)
    },

    onError: () => {
      setHasUpdated(false)
    },
  })
  const { error: updateError } = updateEntreprise

  if (isLoading) {
    return <CircularProgress size={32} sx={{ my: fr.spacing("4v") }} />
  }
  if (!siret) {
    return null
  }
  if (readError) {
    return (
      <Box sx={{ my: fr.spacing("2v") }}>
        <Alert severity="warning" title="Erreur" description={readError.message} />
      </Box>
    )
  }

  const currentCompany = data

  return (
    <>
      {hasUpdated && (
        <Box sx={{ my: fr.spacing("4v") }}>
          <Alert severity="success" title="Succès" description={`Le SIRET ${currentCompany.siret} a été mis à jour.`} />
        </Box>
      )}
      <Typography component="h2" sx={{ fontWeight: 700, mt: 0, mb: fr.spacing("4v") }}>
        Mise à jour des coordonnées pour l’entreprise :
      </Typography>

      <Box sx={{ borderColor: "#000091", borderWidth: "1px", mb: fr.spacing("4v") }}>
        <Formik
          validate={(values) => {
            if (!currentCompany.active && !values.email && !values.phone) return { email: unreferencedLbaRecruteurWarning, phone: unreferencedLbaRecruteurWarning }
            return {}
          }}
          enableReinitialize
          validateOnMount
          initialValues={{ phone: currentCompany.phone, email: currentCompany.email }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email("Insérez un email valide").nullable(),
            phone: phoneValidation().nullable(),
          })}
          onSubmit={(values) => {
            const { phone, email } = values
            if (!phone) values.phone = null
            if (!email) values.email = null
            return updateEntreprise.mutate(values)
          }}
        >
          {({ values, isValid, dirty }) => {
            return (
              <Form>
                <Typography sx={{ fontWeight: 700, mb: fr.spacing("2v"), fontSize: "22px" }}>{currentCompany.enseigne}</Typography>
                <Typography sx={{ color: "#666666", mb: fr.spacing("2v") }}>SIRET {currentCompany.siret}</Typography>
                {!currentCompany.active && (
                  <Typography sx={{ mb: fr.spacing("2v"), color: "#CE0500", fontSize: "14px" }}>
                    Société supprimée de la collection <strong>recruteurslba</strong> mais présente dans <strong>applications</strong>.
                    <br />
                    Seules les mises à jour seront enregistrées.
                  </Typography>
                )}
                <CustomInput required={false} name="phone" label="Nouveau numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                <CustomInput required={false} name="email" label="Nouvel email de contact" type="email" value={values.email} />
                {updateError && <Alert title="Erreur" description={updateError.message} severity="error" />}
                <Box sx={{ display: "flex", justifyContent: "flex-start", mt: fr.spacing("4v") }}>
                  <Button type="submit" data-testid="update_algo_company" disabled={!isValid || !dirty}>
                    Enregistrer les modifications
                  </Button>
                </Box>
              </Form>
            )
          }}
        </Formik>
      </Box>
    </>
  )
}

function DetailPlaceholder() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: fr.spacing("6v"),
        border: "1px solid var(--border-default-grey)",
        color: "text.secondary",
        backgroundColor: fr.colors.decisions.background.default.grey.active,
      }}
    >
      <Typography component="h2" sx={{ fontWeight: 700, mb: fr.spacing("2v") }}>
        Aucune entreprise sélectionnée
      </Typography>
      <Typography sx={{ fontSize: "14px" }}>Sélectionnez une entreprise dans la liste des résultats pour mettre à jour ses coordonnées.</Typography>
    </Box>
  )
}

export default function GestionEntreprises() {
  const [searchInput, setSearchInput] = useState("")
  const [searchField, setSearchField] = useState<ILbaCompanySearchField>("workplace_legal_name")
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [submittedField, setSubmittedField] = useState<ILbaCompanySearchField>("workplace_legal_name")
  const [siret, setSiret] = useState<string>("")

  const isSiretField = submittedField === "workplace_siret"
  const isEnabled = isSiretField ? /^\d{14}$/.test(submittedSearch) : submittedSearch.length >= 2

  const { data, isFetching } = useQuery({
    queryKey: ["/admin/lba-companies", submittedField, submittedSearch],
    queryFn: () => searchLbaCompanies(submittedSearch, submittedField),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
  })

  const companies = useMemo(() => (data as ILbaCompanyForAdminSearchJSON[]) ?? [], [data])
  const columns = useMemo(() => getLbaCompaniesColumns({ onSelect: setSiret }), [])

  const selectedFieldLabel = SEARCH_FIELD_OPTIONS.find((o) => o.value === searchField)?.label ?? ""
  const helpText =
    searchField === "workplace_siret"
      ? "SIRET : correspondance exacte (14 chiffres)."
      : `« ${selectedFieldLabel} » — recherche insensible à la casse (regex). Résultats limités à 100 entreprises. Cibler un autre champ peut réduire le nombre de résultats.`

  const onSearch = () => {
    setSiret("")
    setSubmittedField(searchField)
    setSubmittedSearch(searchInput.trim())
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminGestionDesEntreprises]} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.45fr 1fr" },
          columnGap: "40px",
          rowGap: 0,
          alignItems: "stretch",
        }}
      >
        {/* Ligne 1, colonne gauche : recherche + compteur */}
        <Box sx={{ gridColumn: { lg: "1" }, gridRow: { lg: "1" }, minWidth: 0 }}>
          <Box sx={{ display: "flex", gap: fr.spacing("2v"), alignItems: "flex-end" }}>
            <Input
              label="Rechercher"
              nativeInputProps={{
                value: searchInput,
                placeholder: "Saisissez votre recherche...",
                onChange: (e) => setSearchInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") onSearch()
                },
                style: { minWidth: "600px" },
              }}
            />
            <Select
              label="Cibler un champ"
              nativeSelectProps={{
                value: searchField,
                onChange: (e) => {
                  setSearchField(e.target.value as ILbaCompanySearchField)
                  setSiret("")
                },
                style: { width: "240px" },
              }}
            >
              {SEARCH_FIELD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Button iconId="fr-icon-search-line" priority="primary" onClick={onSearch} data-testid="search_for_algo_company" style={{ marginBottom: "1.5rem" }}>
              Rechercher
            </Button>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: fr.spacing("1v"),
              // mt: fr.spacing("1v"),
              mb: fr.spacing("3v"),
              fontSize: ".875rem",
              color: "var(--text-mention-grey)",
              "& .fr-icon-information-line::before": { "--icon-size": "1rem" },
            }}
          >
            <span className="fr-icon-information-line fr-icon--sm" aria-hidden="true" />
            <span>{helpText}</span>
          </Box>
        </Box>

        {/* Ligne 2, colonne gauche : liste des résultats (pleine largeur tant qu'aucune recherche n'est lancée) */}
        <Box sx={{ gridColumn: { lg: isEnabled ? "1" : "1 / -1" }, gridRow: { lg: "2" }, minWidth: 0 }}>
          {!isEnabled ? (
            <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
              {searchField === "workplace_siret" ? "Saisissez un SIRET (14 chiffres) pour rechercher." : "Saisissez au moins 2 caractères pour rechercher."}
            </Box>
          ) : isFetching ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : companies.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Aucun résultat.</Box>
          ) : (
            <VirtualTable
              caption={`Entreprises de l'algorithme (${companies.length})`}
              columns={columns}
              data={companies}
              defaultSortBy={[{ id: "raison_sociale", desc: false }]}
              hideSearch={true}
              maxHeight="600px"
              onRowClick={(row) => setSiret(row.siret)}
              getRowStyle={(row) => (row.siret === siret ? { backgroundColor: "#eef0ff", boxShadow: "inset 3px 0 0 #000091" } : undefined)}
            />
          )}
        </Box>

        {/* Ligne 2, colonne droite : panneau de détail (aligné sur le haut de la liste) */}
        {(siret || isEnabled) && (
          <Box component="section" sx={{ gridColumn: { lg: "2" }, gridRow: { lg: "2" }, minWidth: 0, display: "flex", flexDirection: "column" }}>
            {siret ? <FormulaireModificationEntreprise siret={siret} /> : <DetailPlaceholder />}
          </Box>
        )}
      </Box>
    </>
  )
}
