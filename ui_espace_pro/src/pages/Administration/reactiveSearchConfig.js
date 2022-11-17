import dayjs from "dayjs"
import { escapeDiacritics, getLocation, getPostcode, getStreet } from "../../common/utils/downloadUtils"
import { CloseCircleLine, SearchLine } from "../../theme/components/icons"

const filters = ["searchFormulaire", "statutFilter", "siretFilter", "libelleFilter", "origineFilter", "niveauFilter", "contratFilter"]
const excludedFields = ["events", "mailing"]

const exportableColumns = [
  {
    Header: "Raison sociale",
    accessor: "raison_sociale",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
  {
    Header: "Siret",
    accessor: "siret",
    exportable: true,
  },
  {
    Header: "Adresse postale",
    accessor: "adresse",
    exportable: true,
    formatter: (value) => {
      let val = escapeDiacritics(value)
      return getStreet(val)
    },
  },
  {
    Header: "Code postal",
    accessor: "adresse",
    exportable: true,
    formatter: (value) => {
      let val = escapeDiacritics(value)
      return getPostcode(val)
    },
  },
  {
    Header: "Commune",
    accessor: "adresse",
    exportable: true,
    formatter: (value) => {
      let val = escapeDiacritics(value)
      return getLocation(val)
    },
  },
  {
    Header: "Prenom",
    accessor: "prenom",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
  {
    Header: "Nom",
    accessor: "nom",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
  {
    Header: "Telephone",
    accessor: "telephone",
    exportable: true,
  },
  {
    Header: "Email",
    accessor: "email",
    exportable: true,
  },
  {
    Header: "Origine",
    accessor: "origine",
    exportable: true,
  },
  {
    Header: "Statut",
    accessor: "offres",
    exportable: true,
    formatter: (values) => {
      return values.map((x, i) => {
        return {
          Statut: escapeDiacritics(x.statut),
          Type: x.type.length > 0 ? x.type.join("/") : x.type[0],
          Metier: escapeDiacritics(x.libelle),
          Niveau: escapeDiacritics(x.niveau),
          Prolongation: x.nombre_prolongation ?? 0,
          Date_prolongation: x.date_derniere_prolongation ? dayjs(x.date_derniere_prolongation).format("YYYY-MM-DD") : "NA",
          Date_creation: dayjs(x.date_creation).format("YYYY-MM-DD"),
          Date_debut_apprentissage: x.date_debut_apprentissage ? dayjs(x.date_debut_apprentissage).format("YYYY-MM-DD") : "NA",
          Date_expiration: dayjs(x.date_expiration).format("YYYY-MM-DD"),
          Description: escapeDiacritics(x.description ?? ""),
        }
      })
    },
  },
  {
    Header: "Type de contrat",
    accessor: "offres.type",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
  {
    Header: "Metier",
    accessor: "offres.libelle",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
  {
    Header: "Niveau",
    accessor: "offres.niveau",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
  {
    Header: "Nombre de prolongation",
    accessor: "offres.nombre_prolongation",
    exportable: true,
  },
  {
    Header: "Date de derniere prolongation de l'offre",
    accessor: "offres.date_derniere_prolongation",
    exportable: true,
    formatter: (value) => dayjs(value).format("YYYY-MM-DD"),
  },
  {
    Header: "Date de creation de l'offre",
    accessor: "offres.date_creation",
    exportable: true,
    formatter: (value) => dayjs(value).format("YYYY-MM-DD"),
  },
  {
    Header: "Date de debut d'apprentissage",
    accessor: "offres.date_debut_apprentissage",
    exportable: true,
    formatter: (value) => dayjs(value).format("YYYY-MM-DD"),
  },
  {
    Header: "Date d'expiration",
    accessor: "offres.date_expiration",
    exportable: true,
    formatter: (value) => dayjs(value).format("YYYY-MM-DD"),
  },
  {
    Header: "Description",
    accessor: "offres.description",
    exportable: true,
    formatter: (value) => escapeDiacritics(value),
  },
]

const facetDefinition = [
  {
    componentId: `statutFilter`,
    dataField: "offres.statut.keyword",
    nestedField: "offres",
    title: "Statut des offres",
    filterLabel: "Statut des offres",
    sortBy: "asc",
    helpTextSection: "",
    showSearch: false,
    showCount: true,
  },
  {
    componentId: `siretFilter`,
    dataField: "siret.keyword",
    title: "Siret",
    filterLabel: "Siret",
    sortBy: "asc",
    helpTextSection: "",
    showSearch: true,
    showCount: true,
  },
  {
    componentId: `libelleFilter`,
    dataField: "offres.libelle.keyword",
    nestedField: "offres",
    title: "Métiers",
    filterLabel: "Métiers",
    sortBy: "asc",
    helpTextSection: "",
    showSearch: true,
    showCount: true,
  },
  {
    componentId: `niveauFilter`,
    dataField: "offres.niveau.keyword",
    nestedField: "offres",
    title: "Niveaux",
    filterLabel: "Niveaux",
    sortBy: "asc",
    helpTextSection: "",
    showSearch: false,
    showCount: true,
  },
  {
    componentId: `contratFilter`,
    dataField: "offres.type.keyword",
    nestedField: "offres",
    title: "Types de contrat",
    filterLabel: "Types de contrat",
    sortBy: "asc",
    helpTextSection: "",
    showSearch: false,
    showCount: true,
  },
  {
    componentId: `origineFilter`,
    dataField: "origine.keyword",
    title: "Origines",
    filterLabel: "Origines",
    selectAllLabel: "Toutes",
    sortBy: "asc",
    helpTextSection: "",
    showSearch: true,
    showCount: true,
  },
]

const dataSearchDefinition = {
  componentId: "searchFormulaire",
  dataField: ["raison_sociale", "siret", "email"],
  fieldWeights: [4, 2, 2],
  excludeFields: excludedFields,
  queryFormat: "and",
  placeholder: "Rechercher par nom d'entreprise, siret ou email",
  showClear: true,
  clearIcon: <CloseCircleLine boxSize={4} />,
  icon: <SearchLine color="bluefrance.500" boxSize={5} />,
  debounce: 1000,
}

export default { filters, facetDefinition, dataSearchDefinition, exportableColumns, excludedFields }
