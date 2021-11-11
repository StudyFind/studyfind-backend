import { sendEmail } from "./send-email";

export const sendNotificationEmail = async (
  type: "RESEARCHER" | "PARTICIPANT",
  email: string,
  notificationDetails: {
    code: string;
    title: string;
    body: string;
    link: string;
  }
) => {
  const settingLink = {
    RESEARCHER: "",
    PARTICIPANT: "",
  }[type];

  const subject = notificationDetails.title;
  const body = `
    ${notificationDetails.body}

    Click <a href="${notificationDetails.link}">here</a> to view updates
    Click <a href="${settingLink}">here</a> to update notification settings
  `;

  return sendEmail(email, subject, body);
};
