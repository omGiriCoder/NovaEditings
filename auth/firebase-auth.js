const ADMIN_EMAIL = "omgoswami4114@gmail.com";

const firebaseConfig = {
    apiKey: "AIzaSyBBZlDnqUvgs0FypnlrmrLzXvzlNTqSQB0",
    authDomain: "nova-editings.firebaseapp.com",
    projectId: "nova-editings",
    appId: "1:951695956594:web:2dca790f249ec09a97c0eb"
};

// ✅ Initialize Firebase ONCE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// ================= GOOGLE LOGIN =================
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;

            if (!user) return;

            // 🔐 ADMIN → admin dashboard
            if (user.email === ADMIN_EMAIL) {
                window.location.href = "admin-dashboard.html";
                return;
            }

            // 👤 NORMAL USERS → role selection
            window.location.href = "role-selection.html";
        })
        .catch((err) => {
            alert(err.message);
        });
}
