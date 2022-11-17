import config from "./config"

const env = config.env

export const getEnvFromProps = (props) => {
  let host = props.publicUrl || env

  let envrnt = "production"
  if (host?.indexOf("recette") >= 0) {
    envrnt = "recette"
  }
  if (host?.indexOf("local") >= 0) {
    envrnt = "local"
  }

  return { env: envrnt }
}

export default env
