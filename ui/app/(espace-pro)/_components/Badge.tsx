import { fr } from "@codegouvfr/react-dsfr"
import { Badge } from "@mui/material"

const variants = {
  inactive: {
    backgroundColor: "#FFE8E5",
    color: "#B34000",
  },
  active: {
    backgroundColor: "#B8FEC9",
    color: "#18753C",
  },
  awaiting: {
    backgroundColor: "#FEECC2",
    color: "#716043",
  },
  neutral: {
    backgroundColor: "#E8EDFF",
    color: "#0063CB",
  },
  stat_number: {
    color: "#2a4365",
    borderRadius: "2px",
    backgroundColor: "#bee3f8",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: "20px",
    padding: `2px ${fr.spacing("1w")}`,
    marginLeft: fr.spacing("2w"),
  },
}

export default function LbaBadge({ variant = "neutral", children, ...props }) {
  return (
    <Badge sx={{ ...variants[variant], px: fr.spacing("1v") }} {...props}>
      {children}
    </Badge>
  )
}
