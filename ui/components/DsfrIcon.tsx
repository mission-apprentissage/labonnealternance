import { Box } from "@mui/material"

export function DsfrIcon({ size, name }: { size: number; name: string }) {
  return (
    <Box
      component="span"
      aria-hidden="true"
      className={name}
      sx={{
        marginRight: "8px",
        "&::before": {
          "--icon-size": size + "px",
        },
      }}
    ></Box>
  )
}
