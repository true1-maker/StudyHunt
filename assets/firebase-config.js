// =============================================
// StudyNest — Firebase Configuration
// =============================================
// STEP 1: Go to https://console.firebase.google.com
// STEP 2: Create a new project named "StudyNest"
// STEP 3: Enable Authentication (Email/Password)
// STEP 4: Enable Firestore Database (Start in test mode)
// STEP 5: Enable Storage
// STEP 6: Register a Web App and copy your config below

const firebaseConfig = {
  apiKey: "AIzaSyA4ceXvyKye0PaufhOTt_eeqsJvCtkQdpc",
  authDomain: "studynest-3dbc2.firebaseapp.com",
  projectId: "studynest-3dbc2",
  storageBucket: "studynest-3dbc2.firebasestorage.app",
  messagingSenderId: "456173443651",
  appId: "1:456173443651:web:e74509981f0629531c92f6",
  measurementId: "G-J51T43CBS3"
};

// Initialize Firebase (compat SDK)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();
// Storage: Cloudinary ব্যবহার হচ্ছে (app.js এ config আছে)

// =============================================
// Firestore Security Rules (paste in console):
// =============================================
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all, write own profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Notes: anyone can read, authenticated users create, owner updates/deletes
    match /notes/{noteId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (resource.data.uploaderId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    // Questions
    match /questions/{questionId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    // Answers
    match /answers/{answerId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    // Quizzes (read all, admin writes)
    match /quizzes/{quizId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    // Notices (read all, admin writes)
    match /notices/{noticeId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
*/

// =============================================
// Storage Rules (paste in Storage > Rules):
// =============================================
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && (request.resource.contentType.matches('image/.*')
            || request.resource.contentType == 'application/pdf');
    }
  }
}
*/
