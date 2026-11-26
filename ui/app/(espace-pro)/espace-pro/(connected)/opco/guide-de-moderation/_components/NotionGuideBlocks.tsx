import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import CallOut, { type CallOutProps } from "@codegouvfr/react-dsfr/CallOut"
import Table from "@codegouvfr/react-dsfr/Table"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { getOpcoGuideVideoPath } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getBlockValue, getRenderableHref, isPlayableVideo, type NotionBlock, type NotionRichText, toPlainText } from "../_lib/notion-guide"
import { OpcoGuideVideo } from "../OpcoGuideTracking"

const CALLOUT_COLORS: Record<string, CallOutProps.ColorVariant> = {
  orange_background: "orange-terre-battue",
  yellow_background: "yellow-tournesol",
  blue_background: "blue-ecume",
  green_background: "green-menthe",
}

export function RichText({ value = [] }: { value?: NotionRichText[] }) {
  return value.map((fragment, index) => {
    const { bold, italic, strikethrough, code } = fragment.annotations
    let node: ReactNode = fragment.plain_text
    if (code) node = <code>{node}</code>
    if (strikethrough) node = <s>{node}</s>
    if (italic) node = <em>{node}</em>
    if (bold) node = <strong>{node}</strong>
    const href = getRenderableHref(fragment.href)
    return href ? (
      <DsfrLink key={index} href={href}>
        {node}
      </DsfrLink>
    ) : (
      <span key={index}>{node}</span>
    )
  })
}

type BlockGroup = { kind: "list"; ordered: boolean; items: NotionBlock[] } | { kind: "block"; block: NotionBlock }

const groupListItems = (blocks: NotionBlock[]): BlockGroup[] =>
  blocks.reduce<BlockGroup[]>((groups, block) => {
    const ordered = block.type === "numbered_list_item"
    if (ordered || block.type === "bulleted_list_item") {
      const last = groups.at(-1)
      if (last?.kind === "list" && last.ordered === ordered) last.items.push(block)
      else groups.push({ kind: "list", ordered, items: [block] })
    } else {
      groups.push({ kind: "block", block })
    }
    return groups
  }, [])

function Block({ block, lead }: { block: NotionBlock; lead: boolean }) {
  const value = getBlockValue(block)
  const children = block.children ? <NotionGuideBlocks blocks={block.children} /> : null

  switch (block.type) {
    case "paragraph":
      if (!toPlainText(value.rich_text)) return null
      return (
        <p className={fr.cx(lead ? "fr-text--lead" : undefined)}>
          <RichText value={value.rich_text} />
        </p>
      )
    case "heading_3":
      return (
        <Typography variant="h5" component="h3" sx={{ mt: fr.spacing("6v"), mb: fr.spacing("3v") }}>
          <RichText value={value.rich_text} />
        </Typography>
      )
    case "callout":
      return (
        <CallOut colorVariant={CALLOUT_COLORS[value.color ?? ""]} bodyAs="div" className={fr.cx("fr-mb-6v")}>
          <p>
            <RichText value={value.rich_text} />
          </p>
          {children}
        </CallOut>
      )
    case "toggle":
      return (
        <Accordion label={toPlainText(value.rich_text)} titleAs="h3">
          {children}
        </Accordion>
      )
    case "quote":
      return (
        <blockquote>
          <p>
            <RichText value={value.rich_text} />
          </p>
          {children}
        </blockquote>
      )
    case "column_list":
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: `repeat(${block.children?.length ?? 1}, 1fr)` }, gap: fr.spacing("6v"), mb: fr.spacing("6v") }}>
          {block.children?.map((column) => (
            <div key={column.id}>{column.children ? <NotionGuideBlocks blocks={column.children} /> : null}</div>
          ))}
        </Box>
      )
    case "table": {
      const rows = (block.children ?? []).map((row) => (getBlockValue(row).cells ?? []).map((cell, index) => <RichText key={index} value={cell} />))
      const [headers, ...data] = value.has_column_header ? rows : [undefined, ...rows]
      return <Table headers={headers} data={data} className={fr.cx("fr-mb-6v")} />
    }
    case "divider":
      return <hr />
    case "video":
      return isPlayableVideo(block) ? <OpcoGuideVideo src={getOpcoGuideVideoPath(block.id)} caption={<RichText value={value.caption} />} /> : null
    default:
      // Bloc non rendu : signalé à Sentry au chargement (cf. structureOpcoGuide).
      return null
  }
}

export function NotionGuideBlocks({ blocks, lead = false }: { blocks: NotionBlock[]; lead?: boolean }) {
  return groupListItems(blocks).map((group) => {
    if (group.kind === "block") return <Block key={group.block.id} block={group.block} lead={lead} />
    const List = group.ordered ? "ol" : "ul"
    return (
      <List key={group.items[0].id}>
        {group.items.map((item) => (
          <li key={item.id}>
            <RichText value={getBlockValue(item).rich_text} />
            {item.children ? <NotionGuideBlocks blocks={item.children} /> : null}
          </li>
        ))}
      </List>
    )
  })
}
