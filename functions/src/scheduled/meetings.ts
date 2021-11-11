import moment from "moment-timezone";
import { sendNotification } from "../triggered/__utils__/send-notification";

import { firestore } from "../admin";
import { NotificationMeta, NotificationData } from "../types";

const MILLIS_IN_30_MINS = 1800000;

const getCurrentTimeRoundedTo30Minutes = () => {
  const MILLIS_AT_UTC_NOW = moment().utc().valueOf();

  return (
    MILLIS_IN_30_MINS +
    Math.floor(MILLIS_AT_UTC_NOW / MILLIS_IN_30_MINS) * MILLIS_IN_30_MINS
  );
};

const add30Minutes = (time: number) => {
  return MILLIS_IN_30_MINS + time;
};

// sends notifications 30 minutes before meeting
export const meetingsRunner = async () => {
  const roundedTime = add30Minutes(getCurrentTimeRoundedTo30Minutes());

  const meetingsRef = await firestore
    .collection("meetings")
    .where("time", "==", roundedTime)
    .get();

  const promises: Promise<any>[] = [];

  meetingsRef.forEach(async (doc) => {
    const meeting = doc.data();
    const { studyID, researcherID, participantID } = meeting;

    const researcherNotificationMeta: NotificationMeta = {
      uid: researcherID,
      type: "RESEARCHER",
    };

    const researcherNotificationData: NotificationData = {
      code: "MEETING_NOW",
      title: `Meeting "${meeting.name}" in 30 minutes`,
      body: `You have a upcoming meeting with a participant for study ${studyID} in 30 minutes`,
      link: meeting.link,
    };

    const participantNotificationMeta: NotificationMeta = {
      uid: participantID,
      type: "PARTICIPANT",
    };

    const participantNotificationData: NotificationData = {
      code: "MEETING_NOW",
      title: `Meeting "${meeting.name}" in 30 minutes`,
      body: `You have a upcoming meeting with a researcher for study ${studyID} in 30 minutes`,
      link: meeting.link,
    };

    promises.push(
      Promise.allSettled([
        sendNotification(
          researcherNotificationMeta,
          researcherNotificationData
        ),
        sendNotification(
          participantNotificationMeta,
          participantNotificationData
        ),
      ])
    );
  });

  return Promise.allSettled(promises);
};
