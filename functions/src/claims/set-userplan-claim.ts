import { auth } from "../admin";

export const setUserplan = async (
  uid: string,
  userplan: "FREE" | "STANDARD" | "PREMIUM"
) => {
  auth.setCustomUserClaims(uid, { userplan });
};
