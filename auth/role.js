const auth = firebase.auth();
const db = firebase.firestore();

// Protect page
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
    }
});

function selectRole(role) {
    const user = auth.currentUser;

    if (!user) {
        alert("User not authenticated");
        return;
    }

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
