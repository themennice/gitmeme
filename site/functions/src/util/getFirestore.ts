import serviceAccount from "../auth/service_account";
import * as admin from "firebase-admin";

let firebaseApp: admin.app.App = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key
  })
});

export default function getFirestore() {
  return firebaseApp.firestore();
}
