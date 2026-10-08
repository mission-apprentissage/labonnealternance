"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useInfiniteQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useId, useRef, useState } from "react"
import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_RATING_OPTIONS } from "shared/models/feedback-form.model"
import type { IFeedbackFormResultsJSON } from "shared/models/feedback-response.model"

import { apiGet } from "@/utils/api.utils"

import { FeedbackFormLoadError } from "../_components/FeedbackFormLoadError"
import { QUESTION_TYPE_LABEL } from "../_utils/questionDrafts"
import type { IFeedbackChoiceStat, IFeedbackQuestionResults } from "./feedbackResults.utils"
import { getChoiceStats } from "./feedbackResults.utils"

type IFeedbackComments = NonNullable<IFeedbackQuestionResults["comments"]>

const mention = { fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default, mb: 0 }

// une couleur par note, lisible sans elle : le libellé et le pourcentage restent affichés
const RATING_COLORS: Record<string, string> = {
  positive: fr.colors.decisions.background.flat.success.default,
  neutral: fr.colors.decisions.background.flat.warning.default,
  negative: fr.colors.decisions.background.flat.error.default,
}
const CHOICE_COLOR = fr.colors.decisions.background.actionHigh.blueFrance.default

function ChoiceBars({ choices, colorFor }: { choices: IFeedbackChoiceStat[]; colorFor: (choice: IFeedbackChoiceStat) => string }) {
  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
      {choices.map((choice) => (
        <Box component="li" key={choice.value} sx={{ p: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: fr.spacing("2v"), mb: fr.spacing("1v") }}>
            <Typography component="span" sx={{ fontSize: "14px" }}>
              {choice.label}
            </Typography>
            <Typography component="span" sx={{ fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
              {choice.share} %
            </Typography>
          </Box>
          <Box aria-hidden="true" sx={{ height: 16, backgroundColor: fr.colors.decisions.background.contrast.grey.default }}>
            <Box sx={{ height: "100%", width: `${choice.share}%`, backgroundColor: colorFor(choice) }} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const ratingLabel = (value: string | null) => FEEDBACK_RATING_OPTIONS.find((option) => option.value === value)?.label ?? null

/**
 * Commentaires d'une question : l'aperçu des résultats, puis, une fois déplié, tous les commentaires
 * chargés page par page. Après « Charger plus », le focus va sur le premier commentaire ajouté,
 * le bouton pouvant disparaître avec la dernière page.
 */
function Comments({ slug, questionId, comments: { total, latest } }: { slug: string; questionId: string; comments: IFeedbackComments }) {
  const [expanded, setExpanded] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)

  const pages = useInfiniteQuery({
    queryKey: ["/admin/feedback-forms/:slug/comments", slug, questionId],
    queryFn: ({ pageParam }) =>
      apiGet("/admin/feedback-forms/:slug/comments", { params: { slug }, querystring: { question_id: questionId, ...(pageParam ? { cursor: pageParam } : {}) } }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor,
    enabled: expanded,
    retry: false,
  })
  const loaded = pages.data?.pages.flatMap((page) => page.comments) ?? []
  // tant que la première page n'est pas arrivée, l'aperçu reste affiché
  const visible = expanded && loaded.length ? loaded : latest

  const loadMore = async () => {
    const previousCount = loaded.length
    const { data } = await pages.fetchNextPage()
    const count = data?.pages.flatMap((page) => page.comments).length ?? previousCount
    if (count === previousCount) return
    setAnnouncement(`${count - previousCount} commentaires ajoutés, ${count} sur ${total}`)
    requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>("li")[previousCount]?.focus())
  }

  return (
    <>
      <Box component="ul" ref={listRef} id={listId} sx={{ m: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
        {visible.map((comment, position) => (
          <Box component="li" key={position} tabIndex={-1} sx={{ p: 0, "&:focus": { outline: "none" } }}>
            <Typography sx={{ fontSize: "14px", mb: fr.spacing("1v") }}>{comment.text}</Typography>
            <Typography sx={{ ...mention, fontSize: "12px" }}>{[dayjs(comment.date).format("DD/MM/YYYY"), ratingLabel(comment.rating)].filter(Boolean).join(" · ")}</Typography>
          </Box>
        ))}
      </Box>
      {expanded && pages.isError && <FeedbackFormLoadError error={pages.error} subject="les commentaires" onRetry={() => pages.refetch()} />}
      {total > latest.length && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
          <Button
            type="button"
            priority="tertiary no outline"
            size="small"
            nativeButtonProps={{ "aria-expanded": expanded, "aria-controls": listId }}
            onClick={() => setExpanded((previous) => !previous)}
          >
            {expanded ? "Voir moins" : `Voir les ${total.toLocaleString("fr-FR")} commentaires`}
          </Button>
          {expanded && pages.hasNextPage && (
            <Button type="button" priority="secondary" size="small" disabled={pages.isFetchingNextPage} onClick={loadMore}>
              {pages.isFetchingNextPage ? "Chargement…" : `Charger plus de commentaires (${loaded.length} sur ${total.toLocaleString("fr-FR")})`}
            </Button>
          )}
        </Box>
      )}
      <p className={fr.cx("fr-sr-only")} aria-live="polite">
        {announcement}
      </p>
    </>
  )
}

/** Répartition des réponses d'une question : barres pour les choix, derniers commentaires pour un texte libre. */
function QuestionStatsCard({ slug, question, index, results }: { slug: string; question: IFeedbackQuestion; index: number; results: IFeedbackQuestionResults }) {
  const plural = (count: number, word: string) => `${count.toLocaleString("fr-FR")} ${word}${count > 1 ? "s" : ""}`
  const isMulti = question.type === "multi_select"
  const selections = results.choices.reduce((sum, { count }) => sum + count, 0)
  const count = results.answered ? (isMulti ? plural(selections, "sélection") : plural(results.answered, "réponse")) : null

  return (
    <Box
      component="article"
      aria-labelledby={`resultats-question-${question.id}`}
      sx={{
        p: fr.spacing("6v"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("4v"),
      }}
    >
      <Box>
        <Typography sx={mention}>
          Q{index + 1} · {QUESTION_TYPE_LABEL[question.type]}
        </Typography>
        <Typography id={`resultats-question-${question.id}`} component="h3" sx={{ fontSize: "16px", lineHeight: "24px", fontWeight: 700, my: fr.spacing("1v") }}>
          {question.label}
        </Typography>
        {count && <Typography sx={mention}>{count}</Typography>}
      </Box>

      {!results.answered ? (
        <Typography sx={mention}>{question.type === "text" ? "Aucun commentaire pour l'instant" : "Aucune réponse pour l'instant"}</Typography>
      ) : results.comments ? (
        <Comments slug={slug} questionId={question.id} comments={results.comments} />
      ) : (
        <ChoiceBars choices={getChoiceStats(question, results)} colorFor={(choice) => (question.type === "rating" ? RATING_COLORS[choice.value] : CHOICE_COLOR)} />
      )}

      {isMulti && results.answered > 0 && (
        <Typography sx={{ ...mention, fontSize: "12px" }}>Plusieurs réponses possibles — les pourcentages portent sur le total des sélections.</Typography>
      )}
    </Box>
  )
}

export function FeedbackQuestionStats({ slug, questions, results }: { slug: string; questions: IFeedbackQuestion[]; results: IFeedbackFormResultsJSON }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
        alignItems: "start",
        columnGap: fr.spacing("4v"),
        rowGap: fr.spacing("6v"),
      }}
    >
      {questions.map((question, index) => (
        <QuestionStatsCard
          key={question.id}
          slug={slug}
          question={question}
          index={index}
          results={results.questions.find(({ question_id }) => question_id === question.id) ?? { question_id: question.id, answered: 0, choices: [], comments: null }}
        />
      ))}
    </Box>
  )
}
