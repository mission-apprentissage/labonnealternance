"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Select } from "@codegouvfr/react-dsfr/Select"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useId, useMemo, useRef, useState } from "react"
import type { ILbaCompanyForAdminSearchJSON, ILbaCompanySearchField } from "shared/routes/update-lba-company.routes"
import { validateSIRET } from "shared/validators/siret-validator"
import * as Yup from "yup"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomInput from "@/app/_components/CustomInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useToast } from "@/app/hooks/useToast"
import { phoneValidation } from "@/common/validation/field-validations"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { getCompanyContactInfo, putCompanyContactInfo, searchLbaCompanies } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { EMAIL_FORMAT_ERROR, EMAIL_FORMAT_HINT, PHONE_FORMAT_HINT } from "@/utils/validation-messages"
import { getLbaCompaniesColumns } from "../_utils/lbaCompaniesColumns"

const unreferencedLbaRecruteurWarning = "Seules les modifications / ajouts sont supportés dans le cas d'une société déréférencée"

const SEARCH_FIELD_OPTIONS: { value: ILbaCompanySearchField; label: string }[] = [
  { value: "workplace_legal_name", label: "Raison sociale" },
  { value: "workplace_brand", label: "Enseigne" },
  { value: "apply_email", label: "E-mail de contact" },
  { value: "apply_phone", label: "Téléphone" },
  { value: "workplace_siret", label: "SIRET" },
]

function FormulaireModificationEntreprise({ siret, onCancel, onSaved }: { siret: string; onCancel: () => void; onSaved: (siret: string) => void }) {
  const {
    isLoading,
    data,
    error: readError,
  } = useQuery({
    queryKey: ["getCompany", siret],
    queryFn: () => getCompanyContactInfo(siret),
    enabled: Boolean(siret),
    retry: false,
  })
  const formRef = useRef<HTMLFormElement>(null)
  const updateEntreprise = useMutation({
    mutationKey: ["updateEntreprise"],
    mutationFn: ({ phone, email }: { phone: string; email: string }) => putCompanyContactInfo({ phone, email, siret }),
    onSuccess: () => onSaved(siret),
  })
  const { error: updateError } = updateEntreprise

  if (isLoading) {
    return <CircularProgress size={32} sx={{ my: fr.spacing("4v") }} />
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
    <Formik
      validate={(values) => {
        if (!currentCompany.active && !values.email && !values.phone) return { email: unreferencedLbaRecruteurWarning, phone: unreferencedLbaRecruteurWarning }
        return {}
      }}
      enableReinitialize
      validateOnMount
      initialValues={{ phone: currentCompany.phone, email: currentCompany.email }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email(EMAIL_FORMAT_ERROR).nullable(),
        phone: phoneValidation().nullable(),
      })}
      onSubmit={(values) => {
        const { phone, email } = values
        if (!phone) values.phone = null
        if (!email) values.email = null
        return updateEntreprise.mutate(values)
      }}
    >
      {(formik) => {
        const { values } = formik
        return (
          <Form ref={formRef} onSubmit={createSubmitWithFocusOnError(formRef, formik)} noValidate>
            <Typography sx={{ fontWeight: 700, mb: fr.spacing("2v"), fontSize: "22px" }}>{currentCompany.enseigne}</Typography>
            <Typography sx={{ color: "#666666", mb: fr.spacing("2v") }}>SIRET {currentCompany.siret}</Typography>
            {!currentCompany.active && (
              <Typography sx={{ mb: fr.spacing("2v"), color: "#CE0500", fontSize: "14px" }}>
                Société supprimée de la collection{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  recruteurslba
                </Box>{" "}
                mais présente dans{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  applications
                </Box>
                .
                <br />
                Seules les mises à jour seront enregistrées.
              </Typography>
            )}
            <CustomInput
              required={false}
              name="phone"
              label="Nouveau numéro de téléphone"
              info={PHONE_FORMAT_HINT}
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              autoComplete="off"
              value={values.phone}
            />
            <CustomInput required={false} name="email" label="Nouvel e-mail de contact" info={EMAIL_FORMAT_HINT} type="email" autoComplete="off" value={values.email} />
            {updateError && <Alert title="Erreur" description={updateError.message} severity="error" />}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}>
              <Button type="button" priority="secondary" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" data-testid="update_algo_company" disabled={updateEntreprise.isPending}>
                Enregistrer les modifications
              </Button>
            </Box>
          </Form>
        )
      }}
    </Formik>
  )
}

const getSearchError = (value: string, field: ILbaCompanySearchField) => {
  if (value.length < 2) return "Saisissez au moins 2 caractères"
  if (field === "workplace_siret" && !validateSIRET(value)) return "Saisissez un SIRET valide de 14 chiffres, sans espace, par exemple 12345678901234"
  return null
}

export default function GestionEntreprises() {
  const [searchInput, setSearchInput] = useState("")
  const [searchField, setSearchField] = useState<ILbaCompanySearchField>("workplace_legal_name")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [submittedField, setSubmittedField] = useState<ILbaCompanySearchField>("workplace_legal_name")
  const [siret, setSiret] = useState<string>("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const helpTextId = useId()
  const modalTitleId = useId()
  const queryClient = useQueryClient()
  const toast = useToast()

  const isEnabled = getSearchError(submittedSearch, submittedField) === null

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
    const value = searchInput.trim()
    const error = getSearchError(value, searchField)
    setSearchError(error)
    if (error) {
      searchInputRef.current?.focus()
      return
    }
    setSiret("")
    setSubmittedField(searchField)
    setSubmittedSearch(value)
  }

  const onSaved = async (updatedSiret: string) => {
    setSiret("")
    toast({ title: `Les coordonnées de l’entreprise (SIRET ${updatedSiret}) ont été mises à jour.` })
    await queryClient.invalidateQueries({ queryKey: ["/admin/lba-companies"] })
    await queryClient.invalidateQueries({ queryKey: ["getCompany", updatedSiret] })
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminGestionDesEntreprises]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {PAGES.static.backAdminGestionDesEntreprises.title}
      </Typography>
      <Box sx={{ display: "flex", gap: fr.spacing("2v"), alignItems: "flex-start" }}>
        <Input
          label="Rechercher (obligatoire)"
          state={searchError ? "error" : "default"}
          stateRelatedMessage={searchError}
          nativeInputProps={{
            ref: searchInputRef,
            value: searchInput,
            required: true,
            placeholder: "Saisissez votre recherche...",
            onChange: (e) => setSearchInput(e.target.value),
            "aria-describedby": helpTextId,
            "aria-invalid": Boolean(searchError),
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
            onChange: (e) => setSearchField(e.target.value as ILbaCompanySearchField),
            style: { width: "240px" },
          }}
        >
          {SEARCH_FIELD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button iconId="fr-icon-search-line" priority="primary" onClick={onSearch} data-testid="search_for_algo_company" className={fr.cx("fr-mt-4w")}>
          Rechercher
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: fr.spacing("1v"),
          mb: fr.spacing("3v"),
          fontSize: ".875rem",
          color: "var(--text-mention-grey)",
          "& .fr-icon-information-line::before": { "--icon-size": "1rem" },
        }}
      >
        <span className="fr-icon-information-line fr-icon--sm" aria-hidden="true" />
        <span id={helpTextId}>{helpText}</span>
      </Box>

      {!isEnabled ? (
        <Box component="p" sx={{ py: 6, m: 0, textAlign: "center", color: "text.secondary" }}>
          {searchField === "workplace_siret" ? "Saisissez un SIRET (14 chiffres) pour rechercher." : "Saisissez au moins 2 caractères pour rechercher."}
        </Box>
      ) : isFetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : companies.length === 0 ? (
        <Box component="p" sx={{ py: 6, m: 0, textAlign: "center", color: "text.secondary" }}>
          Aucun résultat.
        </Box>
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

      <ModalReadOnly isOpen={Boolean(siret)} onClose={() => setSiret("")} ariaLabelledBy={modalTitleId}>
        <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
          <Typography id={modalTitleId} className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("4v") }} component="h2">
            Mise à jour des coordonnées de l’entreprise
          </Typography>
          {siret && <FormulaireModificationEntreprise siret={siret} onCancel={() => setSiret("")} onSaved={onSaved} />}
        </Box>
      </ModalReadOnly>
    </>
  )
}
