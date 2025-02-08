import fs from "fs"
import path from "path"

import { Metadata } from "next"

import { getStaticMetiers, getStaticVilles } from "../../../utils/getStaticData"
import { PAGES } from "../../../utils/routes.utils"

import MetiersRendererClient from "./MetiersRendererClient"

export const metadata: Metadata = {
  title: PAGES.static.metiers.getMetadata.title,
  description: PAGES.static.metiers.getMetadata.description,
}

export default async function Metiers() {
  const txtDirectory = path.join(process.cwd(), "config")

  const towns = getStaticVilles(path, fs, txtDirectory)
  const jobs = getStaticMetiers(path, fs, txtDirectory)

  return <MetiersRendererClient towns={towns} jobs={jobs} />
}
