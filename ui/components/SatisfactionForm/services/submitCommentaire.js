import postCommentaire from "./postCommentaire.js";

export default async function submitCommentaire(
  params,
  setSendingState = () => {},
  _postCommentaire = postCommentaire
) {
  setSendingState("currently_sending");
  let success = true;

  try {
    await _postCommentaire(params);
  } catch (error) {
    console.log("error", error);
    success = false;
  }

  if (success) {
    setSendingState("ok_sent");
  } else {
    setSendingState("not_sent_because_of_errors");
  }
}
