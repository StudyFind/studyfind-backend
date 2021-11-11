import { firestore } from "../../admin";

export const sendEmail = async (to: string, subject: string, html: string) => {
  return firestore.collection("mail").add({ to, message: { subject, html } });
};
