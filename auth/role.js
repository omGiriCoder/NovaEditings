// Firebase Config (same as before)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
    }
});

function selectRole(role) {
    const user = auth.currentUser;

    if (!user) return;

    db.collection("users").doc(user.uid).set({
        role: role,
        email: user.email || null,
        phone: user.phoneNumber || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        if (role === "editor") {
            window.location.href = "editor-dashboard.html";
        } else {
            window.location.href = "client-dashboard.html";
        }
    })
    .catch(err => alert(err.message));
}
