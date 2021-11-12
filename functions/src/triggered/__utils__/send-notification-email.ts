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
    RESEARCHER: "https://researcher.studyfind.org/account/notifications",
    PARTICIPANT: "https://studyfind.org/account/notifications",
  }[type];

  const subject = notificationDetails.title;
  const body = `
    <h3>${notificationDetails.title}</h3>
    <p>${notificationDetails.body}</p>
    <div>
      Click <a href="${notificationDetails.link}">here</a> to view updates
      Click <a href="${settingLink}">here</a> to update notification settings
    </div>
  `;

  return sendEmail(email, subject, body);
};
