import * as functions from "firebase-functions";

import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";

const reminder = functions.firestore.document(
  "studies/{studyID}/participants/{participantID}/reminders/{reminderID}"
);

export const onCreateReminder = reminder.onCreate(async (snapshot) => {
  // 1. Set participant local notification that researcher has created a reminder
  // 1. Set participant email notification that researcher has created a reminder

  const reminder = snapshot.data();

  const participantID = reminder.participantID;

  const meta: NotificationMeta = {
    uid: participantID,
    type: "PARTICIPANT",
  };

  const data: NotificationData = {
    code: "RESEARCHER_CREATED_REMINDER",
    title: "New Reminder",
    body: `A researcher has created a new reminder titled "${reminder.title}" for you.`,
    link: `https://studyfind.org/your-studies/${reminder.studyID}/reminders`,
  };

  return sendNotification(meta, data);
});

export const onUpdateReminder = reminder.onUpdate(async (change) => {
  // If researcher changes reminder details, send participant update notification
  // If participant confirms reminder, send researcher update notification

  const before = change.before.data();
  const after = change.after.data();

  const checkArrayEquality = (arr1: number[], arr2: number[]) => {
    if (arr1.length !== arr2.length) {
      return false;
    }

    const n = arr1.length;

    for (let i = 0; i < n; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }

    return true;
  };

  const hasTitleChanged = before.title !== after.title;
  const hasStartDateChanged = before.startDate !== after.startDate;
  const hasEndDateChanged = before.endDate !== after.endDate;
  const hasTimesChanged = !checkArrayEquality(before.times, after.times);

  if (hasTitleChanged || hasStartDateChanged || hasEndDateChanged || hasTimesChanged) {
    const reminder = after;

    const meta: NotificationMeta = {
      uid: reminder.participantID,
      type: "PARTICIPANT",
    };

    const data: NotificationData = {
      code: "RESEARCHER_UPDATED_REMINDER",
      title: "Reminder Updated",
      link: `https://studyfind.org/your-studies/${reminder.studyID}/reminders`,
      body: `A researcher has updated the reminder titled "${reminder.title}"`,
    };

    return sendNotification(meta, data);
  }

  const hasParticipantConfirmed = !before.confirmedByParticipant && after.confirmedByParticipant;

  if (hasParticipantConfirmed) {
    const reminder = after;

    const meta: NotificationMeta = {
      uid: reminder.researcherID,
      type: "RESEARCHER",
    };

    const data: NotificationData = {
      code: "PARTICIPANT_CONFIRMED_REMINDER",
      title: "Reminder Confirmed",
      link: `https://researcher.studyfind.org/study/${reminder.studyID}/participants/${reminder.participantID}/reminders`,
      body: `Participant ${reminder.participantID} has confirmed your reminder titled "${reminder.title}"`,
    };

    return sendNotification(meta, data);
  }

  return Promise.resolve();
});

export const onDeleteReminder = reminder.onDelete(async (snapshot) => {
  const reminder = snapshot.data();

  const meta: NotificationMeta = {
    uid: reminder.participantID,
    type: "PARTICIPANT",
  };

  const data: NotificationData = {
    code: "RESEARCHER_DELETED_REMINDER",
    title: "Reminder Deleted",
    body: `A researcher has deleted the reminder titled "${reminder.title}"`,
    link: `https://studyfind.org/your-studies/${reminder.studyID}/reminders`,
  };

  return sendNotification(meta, data);
});
