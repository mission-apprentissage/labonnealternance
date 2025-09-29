import { Box, Typography, LinearProgress, Skeleton, Paper } from "@mui/material"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import "./ItemDetailLoading.css"

type Props = {
  type: LBA_ITEM_TYPE
}

const ItemDetailLoading = ({ type }: Props) => {
  const loadingIllustrations =
    type === LBA_ITEM_TYPE.FORMATION
      ? [
          {
            src: "/images/loading/training_description.svg",
            text: "Chargement du descriptif de la formation",
          },
          {
            src: "/images/loading/search_trainings.svg",
            text: "Vérification des coordonnées du centre de formation",
          },
          {
            src: "/images/loading/training_help.svg",
            text: "Lien vers le simulateur d’aides aux alternants",
          },
        ]
      : [
          {
            src: "/images/loading/job_description.svg",
            text: "Chargement du descriptif de l’offre",
          },
          {
            src: "/images/loading/job_contact_info.svg",
            text: "Vérification des coordonnées de l’entreprise",
          },
          {
            src: "/images/loading/job_help.svg",
            text: "Lien vers le simulateur d’aides aux alternants",
          },
        ]

  const resultListProperties = {
    color: "#666666",
    fontWeight: 500,
    fontSize: "18px",
    marginTop: { xs: 0, sm: 0, md: 2 },
  }

  return (
    <Box pt={0}>
      <Box sx={resultListProperties}>
        <Box textAlign="center">
          <Paper elevation={1} sx={{ padding: 6, backgroundColor: "white" }}>
            <Box className="loading-animation">
              {loadingIllustrations.map((item, index) => (
                <div key={index} className="loading-item">
                  <Box component="img" src={item.src} aria-hidden={true} alt="" sx={{ margin: "auto", display: "block" }} />
                  <Typography variant="body1" mt={1}>
                    {item.text}
                  </Typography>
                </div>
              ))}
              <div className="loading-item">
                <Box component="img" src="/images/loading/hourglass.svg" aria-hidden={true} alt="" sx={{ margin: "auto", display: "block" }} />
                <Typography variant="body1" mt={1}>
                  Hum... Ce chargement semble plus long que prévu
                </Typography>
              </div>
            </Box>

            <Box maxWidth="400px" mx="auto" my={4}>
              <LinearProgress
                color={type === LBA_ITEM_TYPE.FORMATION ? "secondary" : "warning"}
                sx={{
                  height: 8,
                  borderRadius: "20px",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: "20px",
                  },
                }}
              />
            </Box>

            <Skeleton variant="circular" width={40} height={40} />
            <Box mt={4} sx={{ "& > *": { mb: 1 } }}>
              <Skeleton variant="text" height={16} />
              <Skeleton variant="text" height={16} />
              <Skeleton variant="text" height={16} />
              <Skeleton variant="text" height={16} width="60%" />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export default ItemDetailLoading
