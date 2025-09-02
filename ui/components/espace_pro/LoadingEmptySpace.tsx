import { Box, CircularProgress, Typography } from "@mui/material"

export default function LoadingEmptySpace({ label = "" }) {
  return (
    <>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
          <CircularProgress size={60} thickness={4} sx={{ color: "primary.main" }} />
          <Typography>{label}</Typography>
        </Box>
      </Box>
    </>
  )
}
