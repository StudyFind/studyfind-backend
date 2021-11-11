import * as functions from "firebase-functions";

import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";
import { getDocument } from "./__utils__/get-document";
import { firestore } from "../admin";

const message = functions.firestore.document(
  "studies/{studyID}/participants/{participantID}/messages/{messageID}"
);

export const onCreateMessage = message.onCreate(async (snapshot, context) => {
  const message = snapshot.data();

  const studyID = context.params.studyID;
  const participantID = context.params.participantID;

  const study = await getDocument(firestore.collection("studies").doc(studyID));
  const researcherID = study?.researcher.id;

  if (message.user === participantID) {
    // participant sent message

    const meta: NotificationMeta = {
      uid: researcherID,
      type: "RESEARCHER",
    };

    const data: NotificationData = {
      code: "NEW_MESSAGE",
      title: "New Message",
      body: `A participant has sent you a message for study ${studyID}`,
      link: `https://researcher.studyfind.org/study/${studyID}/participants/${participantID}/messages`,
    };

    return sendNotification(meta, data);
  }

  if (message.user === researcherID) {
    // researcher sent message

    const meta: NotificationMeta = {
      uid: participantID,
      type: "PARTICIPANT",
    };

    const data: NotificationData = {
      code: "NEW_MESSAGE",
      title: "New Message",
      body: `A researcher has sent you a message for study ${studyID}`,
      link: `https://studyfind.org/your-studies/${studyID}/messages`,
    };

    return sendNotification(meta, data);
  }

  return Promise.resolve();
});
