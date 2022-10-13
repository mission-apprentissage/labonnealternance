export default function toggleCandidature({
  modal = false,
  setSendingState = () => {},
  setModal = () => {},
} = {}) {

  if (!modal) {
    setSendingState('not_sent')
  }
  setModal(!modal);

}
