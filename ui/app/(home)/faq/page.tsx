import { Metadata } from "next"

import { fetchNotionPage } from "../../../services/fetchNotionPage"
import { PAGES } from "../../../utils/routes.utils"

import FAQRendererClient from "./FAQRendererClient"

export const metadata: Metadata = {
  title: PAGES.static.faq.getMetadata.title,
  description: PAGES.static.faq.getMetadata.description,
}

export default async function FAQ() {
  const [recruteur, organisme, candidat] = await Promise.all([
    await fetchNotionPage("95ae35012c6d4a32851b6c7b031fd28e"),
    await fetchNotionPage("b166d0ef1e6042f9a4bfd3a834f498d8"),
    await fetchNotionPage("2543e456b94649e5aefeefa64398b9f9"),
  ])

  return <FAQRendererClient recruteur={recruteur} organisme={organisme} candidat={candidat} />
}
