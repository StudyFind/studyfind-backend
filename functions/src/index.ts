import * as functions from "firebase-functions";

export { onCreateMessage } from "./triggered/message";
export { onCreateStudy, onDeleteStudy } from "./triggered/study";
export { onCreateResearcher, onDeleteResearcher } from "./triggered/researcher";
export { onCreateMeeting, onUpdateMeeting, onDeleteMeeting } from "./triggered/meeting";
export { onCreateReminder, onUpdateReminder, onDeleteReminder } from "./triggered/reminder";
export {
  onCreateStudyParticipant,
  onUpdateStudyParticipant,
  onDeleteStudyParticipant,
} from "./triggered/study-participant";
export { onCreateParticipant, onUpdateParticipant, onDeleteParticipant } from "./triggered/participant";

import { remindersRunner } from "./scheduled/reminders";
import { meetingsRunner } from "./scheduled/meetings";

export const notificationsRunner = functions.pubsub
  .schedule("*/30 * * * *")
  .onRun(() => Promise.allSettled([remindersRunner(), meetingsRunner()]));
