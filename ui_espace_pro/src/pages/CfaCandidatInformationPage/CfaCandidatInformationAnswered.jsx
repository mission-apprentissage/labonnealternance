/**
 * @description CfaCandidatInformationAnswered component.
 * @returns {JSX.Element}
 */
export const CfaCandidatInformationAnswered = (props) => {
  console.log("")
  console.log("---------------props")
  console.log(props)
  return (
    <>
      <div>Merci!</div>
      <div>{props.msg}</div>
      <div>{props.vv.message}</div>
    </>
  )
}
