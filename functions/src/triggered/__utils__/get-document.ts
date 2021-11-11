export const getDocument = async (ref: FirebaseFirestore.DocumentReference) => {
  const snap = await ref.get();
  return snap.data();
};
