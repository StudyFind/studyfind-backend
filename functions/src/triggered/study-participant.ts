import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { firestore } from "../admin";
import { getDocument } from "./__utils__/get-document";
import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";

const studyParticipant = functions.firestore.document("studies/{studyID}/participant/{participantID}");

export const onCreateStudyParticipant = studyParticipant.onCreate(async (snapshot, context) => {
  const participantID = context.params.participantID;
  const studyID = context.params.studyID;

  const study = await getDocument(firestore.collection("studies").doc(studyID));

  const researcherID = study?.researcher.id;

  const meta: NotificationMeta = {
    uid: researcherID,
    type: "RESEARCHER",
  };

  const data: NotificationData = {
    code: "PARTICIPANT_ENROLLED",
    title: "New Participant Enrolled",
    body: `A new participant ${participantID} has enrolled in your study`,
    link: `https://researcher.studyfind.org/study/${studyID}/participants/${participantID}/questions`,
  };

  const appendStudyIDToParticipantEnrolled = async (participantID: string, studyID: string) => {
    firestore
      .collection("participants")
      .doc(participantID)
      .update({
        enrolled: admin.firestore.FieldValue.arrayUnion(studyID),
      });
  };

  return Promise.all([
    sendNotification(meta, data),
    appendStudyIDToParticipantEnrolled(participantID, studyID),
  ]);
});

export const onUpdateStudyParticipant = studyParticipant.onUpdate(async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();

  const hasStatusChanged = before.status !== after.status;

  const participantID = after.id;
  const studyID = context.params.studyID;

  if (hasStatusChanged) {
    const meta: NotificationMeta = {
      uid: participantID,
      type: "PARTICIPANT",
    };

    const data: NotificationData = {
      code: "RESEARCHER_CHANGED_PARTICIPANT_STATUS",
      title: "Study Status Changed",
      body: `Your status for study ${studyID} has changed from "${before.status}" to "${after.status}"`,
      link: "https://studyfind.org/your-studies",
    };

    return sendNotification(meta, data);
  }

  return Promise.resolve();
});
