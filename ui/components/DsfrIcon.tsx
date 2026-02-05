import { fr } from "@codegouvfr/react-dsfr"
import type { BoxProps } from "@mui/material"
import { Box } from "@mui/material"

export function DsfrIcon({ size, name, ...props }: { size: number; name: string } & BoxProps) {
  return (
    <Box
      component="span"
      aria-hidden="true"
      className={name}
      sx={{
        "&::before": {
          "--icon-size": size + "px",
        },
      }}
      marginRight={fr.spacing("1w")}
      {...props}
    ></Box>
  )
}
