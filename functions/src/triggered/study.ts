import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { firestore } from "../admin";

import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";

const study = functions.firestore.document("studies/{studyID}");

export const onCreateStudy = study.onCreate(async (snapshot) => {
  const study = snapshot.data();

  const studyID = snapshot.id;
  const researcherID = study.researcher.id;

  const meta: NotificationMeta = {
    uid: researcherID,
    type: "RESEARCHER",
  };

  const data: NotificationData = {
    code: "CREATE_STUDY",
    title: "Study Created",
    body: `Your study titled "${study.title}" has been created`,
    link: `https://researcher.studyfind.org/study/${studyID}/details`,
  };

  return sendNotification(meta, data);
});

export const onDeleteStudy = study.onDelete(async (snapshot) => {
  const study = snapshot.data();
  const studyID = snapshot.id;

  const researcherID = study.researcher.id;

  const meta: NotificationMeta = {
    uid: researcherID,
    type: "RESEARCHER",
  };

  const data: NotificationData = {
    code: "DELETE_STUDY",
    title: "Study Deleted",
    body: `Your study titled "${study.title}" has been deleted`,
    link: "https://researcher.studyfind.org",
  };

  const removeStudyIDFromParticipantArray = async (studyID: string, arrayName: string) => {
    const snapshot = await firestore
      .collection("participants")
      .where(arrayName, "array-contains", studyID)
      .get();

    snapshot.forEach((doc) =>
      doc.ref.update({
        [arrayName]: admin.firestore.FieldValue.arrayRemove(studyID),
      })
    );
  };

  return Promise.all([
    sendNotification(meta, data),
    removeStudyIDFromParticipantArray(studyID, "enrolled"),
    removeStudyIDFromParticipantArray(studyID, "saved"),
  ]);
});
