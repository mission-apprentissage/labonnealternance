import { Box } from "@mui/material"

export function MailCard({ children, title, isActive }: { children: React.ReactNode; title: React.ReactNode; isActive: boolean }) {
  return (
    <Box
      className={isActive ? "active" : ""}
      sx={{
        backgroundColor: "white",
        borderRadius: "5px",
        overflow: "hidden",

        border: "solid 1px #DDDDDD",
        "& > *": {
          px: "24px",
        },
        "&.active": {
          borderColor: "#000091",

          ".mail-card-title": {
            backgroundColor: "#F5F5FE",
            color: "#000091",
            borderColor: "transparent",
          },
        },
      }}
    >
      <Box
        className="mail-card-title"
        sx={{
          py: "12px",
          backgroundColor: "#F6F6F6",
          borderBottom: "solid 1px #DDDDDD",
        }}
      >
        {title}
      </Box>
      <Box sx={{ py: "24px" }}>{children}</Box>
    </Box>
  )
}
