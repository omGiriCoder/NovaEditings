const firebaseConfig = {
  apiKey: "AIzaSyBBZlDnqUvgs0FypnlrmrLzXvzlNTqSQB0",
  authDomain: "nova-editings.firebaseapp.com",
  projectId: "nova-editings",
  appId: "1:951695956594:web:2dca790f249ec09a97c0eb"
};

// Init once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// ✅ stay logged in
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Auth persistence: LOCAL"))
  .catch(console.error);

// ✅ GOOGLE LOGIN ONLY
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then(() => {
      // redirect handled elsewhere
      window.location.href = "role-selection.html";
    })
    .catch(err => alert(err.message));
}
