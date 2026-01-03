console.log("role.js loaded");

// auth comes from firebase-auth.js
const db = firebase.firestore();

// 🔐 Check auth + role on page load
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const doc = await db.collection("users").doc(user.uid).get();

        // ✅ If role already exists → redirect
        if (doc.exists && doc.data().role) {
            const role = doc.data().role;

            if (role === "editor") {
                window.location.href = "editor-dashboard.html";
            } else if (role === "client") {
                window.location.href = "client-dashboard.html";
            }
        }

        // ❗ If no role → stay on this page
        console.log("No role found, showing selection");

    } catch (error) {
        console.error("Error checking role:", error);
    }
});

// 🎬 Button listeners
document.getElementById("editorBtn").addEventListener("click", () => {
    saveRole("editor");
});

document.getElementById("clientBtn").addEventListener("click", () => {
    saveRole("client");
});

// 💾 Save role
function saveRole(role) {
    const user = auth.currentUser;

    if (!user) {
        alert("User not authenticated");
        return;
    }

    console.log("Saving role:", role);

    db.collection("users").doc(user.uid).set({
        role: role,
        email: user.email || null,
        phone: user.phoneNumber || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        if (role === "editor") {
            window.location.href = "editor-dashboard.html";
        } else {
            window.location.href = "client-dashboard.html";
        }
    })
    .catch(err => {
        console.error(err);
        alert(err.message);
    });
}
