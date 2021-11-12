import { auth, firestore } from "../../admin";
import { getDocument } from "./get-document";
import { sendNotificationLocal } from "./send-notification-local";
import { sendNotificationEmail } from "./send-notification-email";
import { NotificationData, NotificationMeta } from "../../types";

export const sendNotification = async (meta: NotificationMeta, data: NotificationData) => {
  const collection = `${meta.type}s`.toLowerCase();

  const cred = await auth.getUser(meta.uid);
  const user = await getDocument(firestore.collection(collection).doc(meta.uid));

  const emailPreference = user?.notifications.email;

  return Promise.allSettled([
    sendNotificationLocal(meta.type, cred.uid, data),
    emailPreference && sendNotificationEmail(meta.type, cred.email || "", data),
  ]);
};
