import functions from "firebase-functions";

export type snapshot = functions.firestore.QueryDocumentSnapshot;
export type context = functions.EventContext;

export type UserType = "RESEARCHER" | "PARTICIPANT";

export interface NotificationMeta {
  uid: string;
  type: UserType;
}

export interface NotificationData {
  code: string;
  title: string;
  body: string;
  link: string;
}
