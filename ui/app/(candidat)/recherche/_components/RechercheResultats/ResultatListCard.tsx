import { Box, Button, Flex, Image, Link, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { useCallback } from "react"
import { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useNavigateToResultItemDetail } from "@/app/(candidat)/recherche/_hooks/useNavigateToResultItemDetail"
import { useResultItemUrl } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import { useUpdateCandidatSearchParam } from "@/app/(candidat)/recherche/_hooks/useUpdateCandidatSearchParam"
import ItemDetailApplicationsStatus from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import TagCandidatureSpontanee from "@/components/ItemDetail/TagCandidatureSpontanee"
import TagCfaDEntreprise from "@/components/ItemDetail/TagCfaDEntreprise"
import TagFormation from "@/components/ItemDetail/TagFormation"
import TagFormationAssociee from "@/components/ItemDetail/TagFormationAssociee"
import TagOffreEmploi from "@/components/ItemDetail/TagOffreEmploi"
import { isCfaEntreprise } from "@/services/cfaEntreprise"
import { focusWithin } from "@/theme/theme-lba-tools"
import { getDaysSinceDate } from "@/utils/dateUtils"

type ResultCardProps = {
  selected: boolean
  item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation
}

const CenterSearchButton = (props: Pick<ResultCardProps, "item">) => {
  const searchParams = useCandidatRechercheParams()
  const updateSearch = useUpdateCandidatSearchParam()

  const onClick = useCallback(
    async (e) => {
      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }

      updateSearch({
        geo: {
          address: getAdresse(props.item),
          longitude: props.item.place.longitude,
          latitude: props.item.place.latitude,
          radius: 30,
        },
        displayFormations: props.item.ideaType !== LBA_ITEM_TYPE_OLD.FORMATION,
        displayEntreprises: props.item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION,
        displayPartenariats: props.item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION,
        selection: [],
      })
    },
    [props.item, updateSearch]
  )

  if (searchParams.geo) {
    return null
  }

  const searchType = props.item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "entreprises" : "formations"

  return (
    <Button variant="centerSearch" title={`Voir les ${searchType} proches`} color={props.item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "#ff8d7e" : "#01ac8c"} onClick={onClick}>
      <Image mb="2px" mr="5px" src={props.item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "/images/icons/jobPin.svg" : "/images/icons/trainingPin.svg"} alt="" />{" "}
      <Text textDecoration="underline" as="span">
        {`Voir les ${searchType} proches`}
      </Text>
    </Button>
  )
}

function getTitle(item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation) {
  if (item.ideaType === LBA_ITEM_TYPE_OLD.LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return item.company.name
  }

  if (item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    return item.title || item.longTitle
  }

  return item.title
}

function ItemTag(props: Pick<ResultCardProps, "item">) {
  if (props.item.ideaType === LBA_ITEM_TYPE_OLD.LBA || props.item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return <TagCandidatureSpontanee />
  }

  if (props.item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    const isCfa = isCfaEntreprise(props.item?.company?.siret, props.item?.company?.headquarter?.siret)

    return isCfa ? <TagCfaDEntreprise /> : <TagFormation />
  }

  return (
    <>
      <TagOffreEmploi />
      <TagFormationAssociee isMandataire={props.item.company?.mandataire} />
    </>
  )
}

function ItemCompanyName({ item }: Pick<ResultCardProps, "item">) {
  if (item.ideaType === LBA_ITEM_TYPE_OLD.LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return `Secteur d'activité : ${item?.nafs[0]?.label ?? ""}`
  }

  return item.company?.name == null ? <i>Offre anonyme</i> : item.company?.name
}

function getAdresse(item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation) {
  if (item.ideaType === LBA_ITEM_TYPE_OLD.LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA || item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    return item.place.fullAddress
  }

  if (item?.company?.mandataire) {
    return item.place.city
  }

  return item.place.fullAddress
}

function CandidatureCount({ item }: Pick<ResultCardProps, "item">) {
  if (
    item.ideaType === LBA_ITEM_TYPE_OLD.LBA ||
    item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA ||
    item.ideaType === LBA_ITEM_TYPE_OLD.MATCHA ||
    item.ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
  ) {
    return (
      <Box sx={{ alignItems: "center", display: "flex" }}>
        <Image mr={1} src="/images/eclair.svg" alt="" />
        <Typography
          sx={{
            my: 0,
            fontWeight: 400,
            color: fr.colors.decisions.text.default.info.default,
            whiteSpace: "nowrap",
          }}
          className={fr.cx("fr-text--xs")}
        >
          {item.applicationCount} candidature(s)
        </Typography>
      </Box>
    )
  }

  return null
}

function DatePublication({ item }: Pick<ResultCardProps, "item">) {
  if (item.ideaType !== LBA_ITEM_TYPE_OLD.MATCHA && item.ideaType !== LBA_ITEM_TYPE_OLD.PARTNER_JOB) {
    return null
  }

  if (!item?.job?.creationDate) {
    return null
  }

  const daysPublished = getDaysSinceDate(item.job.creationDate)

  return (
    <Typography
      sx={{
        my: 0,
        fontWeight: 400,
        color: fr.colors.decisions.text.mention.grey.default,
        mr: fr.spacing("1w"),
      }}
      className={fr.cx("fr-text--xs")}
    >
      Publiée {`${daysPublished ? `depuis ${daysPublished} jour(s)` : "aujourd'hui"}`}
    </Typography>
  )
}

function EnSavoirPlusButton({ item }: Pick<ResultCardProps, "item">) {
  const labelType = item.ideaType === LBA_ITEM_TYPE_OLD.LBA ? "l'entreprise" : item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "la formation" : "l'offre"

  return (
    <Text ml="auto" display={["none", "none", "block"]}>
      <Button tabIndex={-1} variant="knowMore" aria-label={`Accéder au détail de ${labelType}`}>
        En savoir plus
      </Button>
    </Text>
  )
}

export function ResultCard({ item, selected }: ResultCardProps) {
  const navigateToResultItemDetail = useNavigateToResultItemDetail()
  const onClick = useCallback(() => {
    navigateToResultItemDetail(item)
  }, [navigateToResultItemDetail, item])

  const itemUrl = useResultItemUrl(item)

  const cardProperties = {
    display: "block",
    color: "grey.650",
    cursor: "pointer",
    bg: "white",
    textAlign: "left",
    m: ["0.5rem 0", "18px 25px", "0.5rem 0", "0.5rem 25px"],
    p: ["20px 10px", "20px 25px", "20px 10px", "20px 25px"],
    _hover: {
      textDecoration: "none",
      color: "inherit",
      backgroundColor: "white !important",
    },
    _active: {
      backgroundColor: "white !important",
    },
    filter: undefined,
    ...focusWithin,
  }

  if (selected) {
    cardProperties.filter = "drop-shadow(0px 0px 8px rgba(30, 30, 30, 0.25))"
  }

  const id = item.ideaType === LBA_ITEM_TYPE_OLD.LBA ? item.company.siret : item.id

  return (
    // @ts-expect-error: TODO
    <Link
      as="a"
      className={fr.cx("fr-raw-link")}
      {...cardProperties}
      {...focusWithin}
      // TODO
      // onMouseOver={highlightItemOnMap}
      // onMouseOut={dimItemOnMap}
      href={itemUrl}
      data-testid={`${item.ideaType}${id}`}
      onClick={onClick}
    >
      <Flex align="flex-start" id={`${item.ideaType}:${id}`}>
        <Box flex="1">
          <Flex m="0">
            <Box flex="initial" textAlign="left">
              <Box as="h2" color="black" fontSize="1rem" fontWeight={700} my={0}>
                {getTitle(item)}
              </Box>
            </Box>
            <Box my={[1, 1, 1, "0"]} flex="auto" textAlign="right">
              <ItemTag item={item} />
            </Box>
          </Flex>

          <Typography variant="h3" sx={{ fontWeight: 500 }} className={fr.cx("fr-text--sm")}>
            <ItemCompanyName item={item} />
          </Typography>
          <Typography
            sx={{
              my: 0,
              fontWeight: 400,
              color: fr.colors.decisions.text.title.grey.default,
            }}
            className={fr.cx("fr-text--xs")}
          >
            {getAdresse(item)}
          </Typography>

          <Box as="span" fontSize="12px" color="grey.600" pt={1}>
            {item.place.distance != null && (
              <Typography
                sx={{
                  my: 0,
                  fontWeight: 400,
                  color: fr.colors.decisions.text.mention.grey.default,
                }}
                className={fr.cx("fr-text--xs")}
              >
                {item.place.distance} km(s) du lieu de recherche
              </Typography>
            )}
            <Box sx={{ alignItems: "center", display: "flex" }}>
              <DatePublication item={item} />
              <CandidatureCount item={item} />

              <Box ml="auto" display={["none", "none", "block"]}>
                <EnSavoirPlusButton item={item} />
              </Box>
            </Box>
            <ItemDetailApplicationsStatus item={item} mt={2} mb={2} />
            <CenterSearchButton item={item} />
          </Box>
        </Box>
      </Flex>
    </Link>
  )
}
