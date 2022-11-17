import React from "react"
import StartForm from "../StartForm"

const HomeHero = () => {
  return (
    <div className="c-home-hero">
      <div className="container c-home-hero__container pt-3 pt-sm-5 pb-0 pb-sm-5">
        <div className="card c-home-hero__card">
          <StartForm />
        </div>
      </div>
    </div>
  )
}

export default HomeHero
