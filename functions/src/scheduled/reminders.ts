import moment from "moment-timezone";
import { firestore } from "../admin";
import { getDocument } from "../triggered/__utils__/get-document";
import { sendNotification } from "../triggered/__utils__/send-notification";

const getWeeklyOffset = (time: number) => {
  const MILLIS_IN_WEEK = 604800000;
  const MILLIS_IN_30_MINS = 1800000;
  return (
    Math.floor((time % MILLIS_IN_WEEK) / MILLIS_IN_30_MINS) * MILLIS_IN_30_MINS
  );
};

const forEachTimezone = async (
  fn: (
    timezoneTime: number,
    timezoneDate: string,
    timezoneName: string
  ) => Promise<any>
) => {
  const timezones = moment.tz.zonesForCountry("US", true);

  return Promise.allSettled(
    timezones.map(({ name, offset }) => {
      const offsetInMilliseconds = offset * 60 * 1000;
      const timezoneTime = moment().utc().valueOf() + offsetInMilliseconds;
      const timezoneDate = moment(timezoneTime).tz(name).format("YYYY-MM-DD");
      return fn(timezoneTime, timezoneDate, name);
    })
  );
};

export const remindersRunner = async () => {
  return forEachTimezone(
    async (
      timezoneTime: number,
      timezoneDate: string,
      timezoneName: string
    ) => {
      const remindersRef = await firestore
        .collection("reminders")
        .where("times", "array-contains", getWeeklyOffset(timezoneTime))
        .where("endDate", ">=", timezoneDate)
        .where("startDate", "<=", timezoneDate)
        .get();

      const promises: Promise<any>[] = [];

      remindersRef.forEach(async (doc) => {
        const { title, studyID, participantID } = doc.data();

        const participantRef = firestore
          .collection("participants")
          .doc(participantID);

        const participant = await getDocument(participantRef);

        if (participant?.timezone === timezoneName) {
          promises.push(
            sendNotification(
              {
                uid: participantID,
                type: "PARTICIPANT",
              },
              {
                code: "REMINDER_NOW",
                title: title,
                body: "This is a reminder set by the researcher to notify you. Click here to view the reminder details",
                link: `https://studyfind.org/your-studies/${studyID}/reminders`,
              }
            )
          );
        }
      });
    }
  );
};
