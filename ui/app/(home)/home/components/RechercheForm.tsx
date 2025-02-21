import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Select } from "@codegouvfr/react-dsfr/SelectNext"
import { Box, Typography } from "@mui/material"

import { InputFormField } from "./InputFormField"

export function RechercheForm() {
  return (
    <Box
      sx={{
        padding: fr.spacing("4w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        borderRadius: fr.spacing("1w"),
      }}
    >
      <Typography variant="h2">
        Se former et travailler{" "}
        <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          en alternance
        </Box>
      </Typography>
      <Box
        component="form"
        sx={{
          gap: fr.spacing("2w"),
          alignItems: "flex-end",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr 1fr min-content 1fr min-content",
          },
        }}
      >
        <InputFormField
          label="Métier ou diplôme"
          style={{
            marginBottom: 0,
          }}
          nativeInputProps={{
            placeholder: "Indiquer un métier ou un diplôme",
          }}
        />
        <InputFormField
          label="Lieu"
          style={{
            marginBottom: 0,
          }}
          nativeInputProps={{
            placeholder: "À quel endroit ?",
          }}
        />
        <Box
          sx={{
            width: {
              xs: "100%",
              lg: "120px",
            },
          }}
        >
          <Select
            label="Rayon"
            style={{
              marginBottom: 0,
            }}
            nativeSelectProps={{
              name: "rayon",
            }}
            options={[
              {
                value: "10",
                label: "10 km",
              },
              {
                value: "30",
                label: "30 km",
                selected: true,
              },
              {
                value: "60",
                label: "60 km",
              },
              {
                value: "100",
                label: "100 km",
              },
            ]}
          />
        </Box>
        <Select
          label="Niveau d'études visé"
          style={{
            marginBottom: 0,
          }}
          nativeSelectProps={{
            name: "niveau",
          }}
          options={[
            {
              value: "10",
              label: "10 km",
            },
            {
              value: "30",
              label: "30 km",
              selected: true,
            },
            {
              value: "60",
              label: "60 km",
            },
            {
              value: "100",
              label: "100 km",
            },
          ]}
        />
        <Box
          sx={{
            whiteSpace: "nowrap",
            py: {
              xs: fr.spacing("2w"),
              lg: 0,
            },
          }}
        >
          <Button iconPosition="left" iconId="fr-icon-search-line">
            C'est parti
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
