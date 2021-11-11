import * as functions from "firebase-functions";

import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";

const meeting = functions.firestore.document("meetings/{meetingID}");

export const onCreateMeeting = meeting.onCreate(async (snapshot, context) => {
  // 1. Set participant local notification that researcher has created a meeting
  // 1. Set participant email notification that researcher has created a meeting

  const meeting = snapshot.data();

  const participantID = context.params.participantID;

  const meta: NotificationMeta = {
    uid: participantID,
    type: "PARTICIPANT",
  };

  const data: NotificationData = {
    code: "RESEARCHER_CREATED_MEETING",
    title: "New Meeting",
    body: `A researcher has scheduled a new meeting titled "${meeting.name}" with you.`,
    link: `https://studyfind.org/your-studies/${meeting.studyID}/meetings`,
  };

  return sendNotification(meta, data);
});

export const onUpdateMeeting = meeting.onUpdate(async (change, context) => {
  // If researcher changes meeting details, send participant update notification
  // If participant confirms meeting, send researcher update notification

  const before = change.before.data();
  const after = change.after.data();

  // PARTICIPANT
  const participantID = context.params.participantID;

  const hasNameChanged = before.name !== after.name;
  const hasLinkChanged = before.link !== after.link;
  const hasTimeChanged = before.time !== after.time;

  if (hasNameChanged || hasLinkChanged || hasTimeChanged) {
    const meeting = after;

    const meta: NotificationMeta = {
      uid: participantID,
      type: "PARTICIPANT",
    };

    const data: NotificationData = {
      code: "RESEARCHER_UPDATED_MEETING",
      title: "Meeting Updated",
      body: `A researcher has updated the meeting titled "${meeting.name}"`,
      link: `https://studyfind.org/your-studies/${meeting.studyID}/meetings`,
    };

    return sendNotification(meta, data);
  }

  // RESEARCHER

  const hasParticipantConfirmed =
    !before.confirmedByParticipant && after.confirmedByParticipant;

  if (hasParticipantConfirmed) {
    const meeting = after;

    const meta: NotificationMeta = {
      uid: "RESEARCHER",
      type: meeting.researcherID,
    };

    const data: NotificationData = {
      code: "PARTICIPANT_CONFIRMED_MEETING",
      title: "Meeting Updated",
      body: `The participant ${meeting.participantID} has confirmed your meeting titled "${meeting.name}"`,
      link: `https://researcher.studyfind.org/study/${meeting.studyID}/participants/${meeting.participantID}/meetings`,
    };

    return sendNotification(meta, data);
  }

  return Promise.resolve();
});

export const onDeleteMeeting = meeting.onDelete(async (snapshot, context) => {
  const meeting = snapshot.data();

  const participantID = context.params.participantID;

  const meta: NotificationMeta = {
    uid: "PARTICIPANT",
    type: participantID,
  };

  const data: NotificationData = {
    code: "RESEARCHER_DELETED_MEETING",
    title: "Meeting Deleted",
    body: `A researcher has deleted the meeting titled "${meeting.name}"`,
    link: `https://studyfind.org/your-studies/${meeting.studyID}/meetings`,
  };

  return sendNotification(meta, data);
});
