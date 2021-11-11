import { auth } from "../admin";

export const setUsertype = async (
  uid: string,
  usertype: "RESEARCHER" | "PARTICIPANT"
) => {
  auth.setCustomUserClaims(uid, { usertype });
};
