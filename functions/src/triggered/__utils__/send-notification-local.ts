import { firestore } from "../../admin";
import { NotificationData } from "../../types";

export const sendNotificationLocal = async (
  type: "RESEARCHER" | "PARTICIPANT",
  uid: string,
  notificationDetails: NotificationData
) => {
  const now = new Date().getTime();
  const collection = `${type}s`.toLowerCase();

  const notification = {
    ...notificationDetails,
    read: false,
    time: now,
  };

  return firestore
    .collection(collection)
    .doc(uid)
    .collection("notifications")
    .add(notification);
};
