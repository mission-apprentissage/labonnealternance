import { fr } from "@codegouvfr/react-dsfr"
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox"
import { CircularProgress } from "@mui/material"
import { useField } from "formik"
import { assertUnreachable } from "shared"

import { IUseRechercheResults, QueryStatus } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { UserItemTypes } from "@/app/_components/RechercheForm/RechercheForm"

export const RechercheResultTypeCheckboxFormik = ({ rechercheResults }: { rechercheResults?: IUseRechercheResults }) => {
  const [field, _meta, helper] = useField({ name: "displayedItemTypes" })
  const checkedLabels: UserItemTypes[] = field.value || []

  return <RechercheResultTypeCheckbox checked={checkedLabels} onChange={(newValues) => helper.setValue(newValues, true)} rechercheResults={rechercheResults} />
}

export const RechercheResultTypeCheckbox = ({
  checked,
  onChange,
  rechercheResults,
}: {
  checked: UserItemTypes[]
  onChange: (checked: UserItemTypes[]) => void
  rechercheResults?: IUseRechercheResults
}) => {
  const isChecked = (label: UserItemTypes) => checked.includes(label)

  const toggleValue = (label: UserItemTypes, wasChecked: boolean) => {
    const newCheckedLabels = wasChecked ? checked.filter((labelIte) => labelIte !== label) : [...checked, label]
    onChange(newCheckedLabels)
  }

  const counts = rechercheResults ? getItemCounts(rechercheResults) : null

  return (
    <Checkbox
      classes={{
        root: fr.cx("fr-m-0", "fr-p-0"),
        content: fr.cx("fr-m-0", "fr-p-0"),
      }}
      disabled={false}
      options={Object.values(UserItemTypes).map((itemType) => {
        const checked = isChecked(itemType)
        const count = counts?.[itemType]
        const displayLoading: boolean = rechercheResults ? getQueryStatus(rechercheResults, itemType) === "loading" : false
        return {
          label: (
            <>
              {itemType}
              {count !== undefined ? ` (${count})` : displayLoading ? <CircularProgress size={14} style={{ marginLeft: fr.spacing("1w") }} /> : null}
            </>
          ),
          nativeInputProps: {
            checked,
            onChange: () => toggleValue(itemType, checked),
            name: itemType,
          },
        }
      })}
      orientation="horizontal"
      small
    />
  )
}

function getQueryStatus(rechercheResult: IUseRechercheResults, itemType: UserItemTypes): QueryStatus {
  switch (itemType) {
    case UserItemTypes.EMPLOI:
      return rechercheResult.jobQuery.status
    case UserItemTypes.FORMATIONS:
      return rechercheResult.formationQuery.status
    default:
      assertUnreachable(itemType)
  }
}

function getItemCounts(rechercheResults: IUseRechercheResults) {
  const {
    formationQuery,
    formationQuery: { formations },
    jobQuery,
    jobs,
  } = rechercheResults
  const result = {
    [UserItemTypes.EMPLOI]: jobQuery.status === "success" ? jobs.length : undefined,
    [UserItemTypes.FORMATIONS]: formationQuery.status === "success" ? formations.length : undefined,
  }
  return result
}
