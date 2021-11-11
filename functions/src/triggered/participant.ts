import * as functions from "firebase-functions";

import { auth, firestore } from "../admin";

import { setUserplan } from "../claims/set-userplan-claim";
import { setUsertype } from "../claims/set-usertype-claim";

import { sendEmail } from "./__utils__/send-email";
import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";

const participant = functions.firestore.document(
  "participants/{participantID}"
);

export const onCreateParticipant = participant.onCreate(async (snapshot) => {
  // 1. Set usertype custom claim
  // 2. Set userplan custom claim
  // 3. Send welcome notification
  // 4. Send welcome email

  const uid = snapshot.id;
  const plan = "FREE";
  const type = "PARTICIPANT";
  const user = await auth.getUser(uid);

  setUserplan(uid, plan);
  setUsertype(uid, type);

  const meta: NotificationMeta = { uid, type };

  const data: NotificationData = {
    code: "CREATE_ACCOUNT",
    title: "Welcome to StudyFind!",
    body: `Your account has been successfully created as ${user.displayName}. Please verify your email to start enrolling in studies!`,
    link: "https://studyfind.org",
  };

  sendNotification(meta, data);
});

export const onUpdateParticipant = participant.onUpdate(async (snapshot) => {
  // 1. Update all respective studyParticipant documents in enrolled studies with updated timezone/availability

  const uid = snapshot.after.id;
  const before = snapshot.before.data();
  const after = snapshot.after.data();

  const hasTimezoneChanged = before.timezone !== after.timezone;
  const hasAvailabilityChanged = before.availability !== after.availability;

  if (hasTimezoneChanged || hasAvailabilityChanged) {
    const { timezone, availability, enrolled } = after;

    Promise.allSettled(
      enrolled.map((studyID: string) => {
        return firestore
          .collection("studies")
          .doc(studyID)
          .collection("participants")
          .doc(uid)
          .update({ timezone, availability });
      })
    );
  }
});

export const onDeleteParticipant = participant.onDelete(async (snapshot) => {
  // 1. Send goodbye email
  // 2. Delete all associated study participant documents
  // 2. Delete all associated reminder documents
  // 2. Delete all associated meeting documents

  const uid = snapshot.id;
  const user = await auth.getUser(uid);
  const name = user.displayName || "Loyal StudyFind Participant";
  const email = user.email || "";

  const goodbyeSurveyLink = "https://google.com";
  const goodbyeEmailSubject = "StudyFind will miss you!";
  const goodbyeEmailBody = `
    Dear ${name},

    As requested, your account has been successfully deleted along with all your personal data and you have been removed from all enrolled research studies. We truly hope someday you change your mind and consider joining us again. Please know our door is always open, and we'd love to have you back. We would really appreciate it if you could <a href="${goodbyeSurveyLink}"> answer a few questions </a> for us to help us improve our services. If this is truly goodbye, we want to thank you once again for being part of the StudyFind community!

    Best,
    The StudyFind Team
  `;

  const enrolled = snapshot.get("enrolled");

  const deleteAllStudyParticipantDocuments = () => {
    return Promise.allSettled(
      enrolled.map((studyID: string) => {
        return firestore
          .collection("studies")
          .doc(studyID)
          .collection("participants")
          .doc(uid)
          .delete();
      })
    );
  };

  const deleteAllReminderDocuments = async () => {
    const snapshot = await firestore
      .collection("reminders")
      .where("participantID", "==", uid)
      .get();

    const promises: Promise<FirebaseFirestore.WriteResult>[] = [];

    snapshot.forEach((doc) => {
      promises.push(doc.ref.delete());
    });

    return Promise.allSettled(promises);
  };

  const deleteAllMeetingDocuments = async () => {
    const snapshot = await firestore
      .collection("meetings")
      .where("participantID", "==", uid)
      .get();

    const promises: Promise<FirebaseFirestore.WriteResult>[] = [];

    snapshot.forEach((doc) => {
      promises.push(doc.ref.delete());
    });

    return Promise.allSettled(promises);
  };

  return Promise.allSettled([
    sendEmail(email, goodbyeEmailSubject, goodbyeEmailBody),
    deleteAllStudyParticipantDocuments(),
    deleteAllReminderDocuments(),
    deleteAllMeetingDocuments(),
  ]);
});
