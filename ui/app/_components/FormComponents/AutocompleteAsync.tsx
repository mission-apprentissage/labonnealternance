import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography, CircularProgress } from "@mui/material"
import Autocomplete, { AutocompleteRenderGroupParams, AutocompleteRenderInputParams, AutocompleteRenderOptionState } from "@mui/material/Autocomplete"
import { useWindowSize } from "@uidotdev/usehooks"
import match from "autosuggest-highlight/match"
import parse from "autosuggest-highlight/parse"
import { useField, useFormikContext } from "formik"
import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery } from "react-query"

import { InputFormField } from "@/app/_components/FormComponents/InputFormField"

function identity<T>(value: T) {
  return value
}

interface AutocompleteAsyncProps<T> {
  fetchOptions: (inputValue: string) => Promise<T[]>

  getOptionKey: (option: T) => string
  getOptionLabel: (option: T) => string
  groupBy?: (option: T) => string

  noOptionsText: string
  placeholder: string

  id: string
  label: string
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

// This is different from basic throttle because it will always trigger the first event immediately
function useThrottle(value: string, delay: number) {
  const lastUpdateRef = useRef<number | null>(null)
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const now = Date.now()

    if (lastUpdateRef.current === null || now - lastUpdateRef.current >= delay) {
      lastUpdateRef.current = now
      setDebouncedValue(value)
      return
    }

    const timeout = setTimeout(() => {
      lastUpdateRef.current = now
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}

export function AutocompleteAsync<T>(props: AutocompleteAsyncProps<T>) {
  // https://github.com/mui/material-ui/issues/27670#issuecomment-2079148513
  useWindowSize()

  const { getOptionKey, getOptionLabel } = props
  const [{ onBlur, value }, meta] = useField(props.id)
  const { setFieldValue } = useFormikContext()

  const [query, setQuery] = useState(meta.initialValue ? getOptionLabel(meta.initialValue) : "")
  const debouncedQuery = useThrottle(query, 300)

  const enabled = debouncedQuery.length > 0

  const onInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.type === "change") {
      setQuery(event?.target?.value ?? "")
    }
  }, [])

  const result = useQuery(["autocomplete", props.id, debouncedQuery], async () => props.fetchOptions(debouncedQuery), { enabled, staleTime: Infinity })

  const isDeferredOrFetching = result.isFetching || query !== debouncedQuery

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
          action={
            isDeferredOrFetching ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: fr.spacing("4w"),
                  position: "absolute",
                  right: 1,
                  top: 1,
                  bottom: 1,
                  backgroundColor: fr.colors.decisions.background.default.grey.default,
                }}
              >
                <CircularProgress color="inherit" size={fr.spacing("2w")} />
              </Box>
            ) : null
          }
          state={meta.touched && meta.error ? "error" : "default"}
          stateRelatedMessage="champ obligatoire"
        />
      )
    },
    [props.label, props.placeholder, isDeferredOrFetching, meta]
  )

  const renderOption = useCallback(
    (params: React.HTMLAttributes<HTMLLIElement>, option: T, { inputValue }: AutocompleteRenderOptionState) => {
      const key = getOptionKey(option)
      const label = getOptionLabel(option)

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
            color: isDeferredOrFetching ? fr.colors.decisions.text.disabled.grey.default : fr.colors.decisions.text.default.grey.default,
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
    [getOptionKey, getOptionLabel, isDeferredOrFetching]
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
      getOptionLabel={getOptionLabel}
      getOptionKey={getOptionKey}
      value={value}
      renderInput={renderInput}
      onInputChange={onInputChange}
      renderGroup={renderGroup}
      onBlur={onBlur}
      groupBy={props.groupBy}
      isOptionEqualToValue={(option, value) => getOptionKey(option) === getOptionKey(value)}
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
      onChange={(_e, value) => {
        setFieldValue(props.id, value)
      }}
      filterOptions={identity}
      noOptionsText={enabled ? props.noOptionsText : props.placeholder}
      size="small"
      renderOption={renderOption}
    />
  )
}
