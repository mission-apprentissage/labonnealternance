export default function toggleCandidature({ isModalOpen = false, setSendingState = () => {}, setIsModalOpen = () => {} } = {}) {
  if (!isModalOpen) {
    setSendingState("not_sent")
  }
  setIsModalOpen(!isModalOpen)
}
