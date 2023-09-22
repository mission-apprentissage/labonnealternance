export default function toggleCandidature({ isModalOpen = false, setSendingState = () => {}, setIsModalOpen = () => {} } = {}) {
  if (!isModalOpen) {
    // @ts-expect-error: TODO
    setSendingState("not_sent")
  }
  // @ts-expect-error: TODO
  setIsModalOpen(!isModalOpen)
}
