import { getStaticMetiers } from "../utils/getStaticData"

function generateSiteMap(dataJobs, props) {
  const host = `${props.req.headers.host === "localhost" ? "http://" : "https://"}${props.req.headers.host}`

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${host}</loc></url>
    <url><loc>${host}/a-propos</loc></url>
    <url><loc>${host}/acces-recruteur</loc></url>
    <url><loc>${host}/cgu</loc></url>
    <url><loc>${host}/contact</loc></url>
    <url><loc>${host}/developpeurs</loc></url>
    <url><loc>${host}/faq</loc></url>
    <url><loc>${host}/mentions-legales</loc></url>
    <url><loc>${host}/metiers</loc></url>
    <url><loc>${host}/organisme-de-formation</loc></url>
    <url><loc>${host}/politique-de-confidentialite</loc></url>    
    ${dataJobs
      .map((job) => {
        return `
        <url>
            <loc>${host}/metiers/${job.slug}</loc>
        </url>
      `
      })
      .join("")}
   </urlset>
 `
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps(props) {
  const path = require("path")
  const fs = require("fs")
  const txtDirectory = path.join(process.cwd(), "config")

  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  // We generate the XML sitemap with the posts data
  const sitemap = generateSiteMap(dataJobs, props)

  props.res.setHeader("Content-Type", "text/xml")
  // we send the XML to the browser
  props.res.write(sitemap)
  props.res.end()

  return {
    props: {},
  }
}

export default SiteMap
