import * as functions from "firebase-functions";

import { auth, firestore } from "../admin";

import { setUserplan } from "../claims/set-userplan-claim";
import { setUsertype } from "../claims/set-usertype-claim";

import { sendEmail } from "./__utils__/send-email";
import { sendNotification } from "./__utils__/send-notification";
import { NotificationMeta, NotificationData } from "../types";

const researcher = functions.firestore.document("researchers/{researcherID}");

export const onCreateResearcher = researcher.onCreate(async (snapshot) => {
  // 1. Set usertype custom claim
  // 2. Set userplan custom claim
  // 3. Send welcome notification
  // 4. Send welcome email

  const uid = snapshot.id;
  const plan = "FREE";
  const type = "RESEARCHER";
  const user = await auth.getUser(uid);

  setUserplan(uid, plan);
  setUsertype(uid, type);

  const meta: NotificationMeta = { uid, type };

  const data: NotificationData = {
    code: "CREATE_ACCOUNT",
    title: "Welcome to StudyFind!",
    body: `Your account has been successfully created as ${user.displayName}. Please verify your email to start creating studies!`,
    link: "https://researcher.studyfind.org",
  };

  return sendNotification(meta, data);
});

export const onDeleteResearcher = researcher.onDelete(async (snapshot) => {
  // 1. Send goodbye email
  // 2. Delete all associated reminder documents
  // 2. Delete all associated meeting documents
  // 2. Delete all associated study documents

  const uid = snapshot.id;
  const user = await auth.getUser(uid);
  const name = user.displayName || "Loyal StudyFind Researcher";
  const email = user.email || "";

  const goodbyeSurveyLink = "https://google.com";
  const goodbyeEmailSubject = "We're sad to see you go...";
  const goodbyeEmailBody = `
    Dear ${name},

    We at StudyFind appreciated working with you and are sad to see you go. We would truly appreciate learning the reason behind your cancellation, so we can continue improving our services. Click <a href="${goodbyeSurveyLink}">here</a> to tell us what we could have done differently. We want to thank you for choosing StudyFind and hope you'll consider joining again in the future.

    Best,
    The StudyFind Team
  `;

  const deleteAllReminderDocuments = async () => {
    const snapshot = await firestore
      .collection("reminders")
      .where("researcherID", "==", uid)
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
      .where("researcherID", "==", uid)
      .get();

    const promises: Promise<FirebaseFirestore.WriteResult>[] = [];

    snapshot.forEach((doc) => {
      promises.push(doc.ref.delete());
    });

    return Promise.allSettled(promises);
  };

  const deleteAllStudyDocuments = async () => {
    const snapshot = await firestore
      .collection("studies")
      .where("researcher.id", "==", uid)
      .get();

    const promises: Promise<FirebaseFirestore.WriteResult>[] = [];

    snapshot.forEach((doc) => {
      promises.push(doc.ref.delete());
    });

    return Promise.allSettled(promises);
  };

  return Promise.allSettled([
    sendEmail(email, goodbyeEmailSubject, goodbyeEmailBody),
    deleteAllReminderDocuments(),
    deleteAllMeetingDocuments(),
    deleteAllStudyDocuments(),
  ]);
});
