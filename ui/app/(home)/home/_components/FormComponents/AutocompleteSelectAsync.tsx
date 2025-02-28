import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { AutocompleteRenderGroupParams, AutocompleteRenderInputParams, AutocompleteRenderOptionState } from "@mui/material/Autocomplete"
import Autocomplete from "@mui/material/Autocomplete"
import { useWindowSize } from "@uidotdev/usehooks"
import match from "autosuggest-highlight/match"
import parse from "autosuggest-highlight/parse"
import { useCallback, useState } from "react"
import { useQuery } from "react-query"

import { InputFormField } from "@/app/(home)/home/_components/FormComponents/InputFormField"

function identity<T>(value: T) {
  return value
}

interface AutocompleteSelectProps<T> {
  onChange: (value: T | null) => void

  fetchOptions: (inputValue: string) => Promise<T[]>

  getOptionKey: (option: T) => string
  getOptionLabel: (option: T) => string
  groupBy?: (option: T) => string

  noOptionsText: string
  placeholder: string

  id: string
  label: string
}

async function sleep(durationMs: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => {
    let timeout: NodeJS.Timeout | null = null

    const listener = () => {
      if (timeout) clearTimeout(timeout)
      resolve()
    }

    timeout = setTimeout(() => {
      signal?.removeEventListener("abort", listener)
      resolve()
    }, durationMs)

    signal?.addEventListener("abort", listener)
  })
}
function renderGroup(props: AutocompleteRenderGroupParams) {
  return (
    <li key={props.group}>
      <Typography
        className={fr.cx("fr-text--sm", "fr-text--bold")}
        sx={{
          textTransform: "uppercase",
          color: fr.colors.decisions.artwork.minor.blueFrance.default,
          py: fr.spacing("1w"),
          px: fr.spacing("2w"),
        }}
      >
        {props.group}
      </Typography>
      <Box component="ul" sx={{ p: 0, m: 0 }}>
        {props.children}
      </Box>
    </li>
  )
}

export function AutocompleteSelectAsync<T>(props: AutocompleteSelectProps<T>) {
  // https://github.com/mui/material-ui/issues/27670#issuecomment-2079148513
  useWindowSize()

  const [query, setQuery] = useState("")

  const onInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event?.target?.value ?? "")
  }, [])

  const enabled = query.length > 0
  const result = useQuery(
    ["autocomplete", props.id, query],
    async ({ signal }) => {
      // Debounce the API call
      await sleep(300, signal)
      if (signal.aborted) return

      return props.fetchOptions(query)
    },
    { enabled, staleTime: Infinity }
  )

  const renderInput = useCallback(
    (params: AutocompleteRenderInputParams) => {
      return (
        <InputFormField
          label={props.label}
          // @ts-expect-error
          ref={params.InputProps.ref}
          nativeInputProps={{
            ...params.inputProps,
            placeholder: props.placeholder,
          }}
        ></InputFormField>
      )
    },
    [props.label, props.placeholder]
  )

  const renderOption = useCallback(
    (params: React.HTMLAttributes<HTMLLIElement>, option: T, { inputValue }: AutocompleteRenderOptionState) => {
      const key = props.getOptionKey(option)
      const label = props.getOptionLabel(option)

      const matches = match(label, inputValue, { insideWords: true, findAllOccurrences: true })
      const parts = parse(label, matches)

      return (
        <Box
          component={"li"}
          {...params}
          key={key}
          sx={{
            px: fr.spacing("2w"),
            py: fr.spacing("1w"),
          }}
        >
          <Typography className={fr.cx("fr-text--sm")}>
            {parts.map((part, index) => (
              <Box
                component="span"
                key={index}
                sx={{
                  fontWeight: part.highlight ? 700 : 400,
                }}
              >
                {part.text}
              </Box>
            ))}
          </Typography>
        </Box>
      )
    },
    [props.getOptionKey, props.getOptionLabel]
  )

  // TODO: create a basic AutoComplete DSFR with static options which can be used here too to share the same design
  return (
    <Autocomplete
      id={props.id}
      disablePortal
      openOnFocus
      loading={result.isLoading}
      loadingText="Veuillez patienter"
      options={result.data ?? []}
      getOptionLabel={props.getOptionLabel}
      getOptionKey={props.getOptionKey}
      renderInput={renderInput}
      onInputChange={onInputChange}
      renderGroup={renderGroup}
      groupBy={props.groupBy}
      classes={{
        noOptions: fr.cx("fr-text--sm"),
      }}
      slotProps={{
        popper: {
          placement: "bottom",
          modifiers: [
            { name: "flip", enabled: false },
            { name: "offset", options: { offset: [0, 12] } },
          ],
          sx: {
            backgroundColor: "red",
          },
        },
        paper: {
          sx: {
            minWidth: {
              lg: "450px",
            },
            boxShadow: "rgba(0, 0, 0, 0.2) 1px 1p 10px 0px",
          },
          elevation: 6,
        },
        listbox: {
          sx: {
            maxHeight: "576px",
          },
        },
      }}
      onChange={(event, value) => {
        props.onChange(value)
      }}
      filterOptions={identity}
      noOptionsText={enabled ? props.noOptionsText : props.placeholder}
      size="small"
      renderOption={renderOption}
    />
  )
}
