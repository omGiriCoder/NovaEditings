const firebaseConfig = {
    apiKey: "AIzaSyBBZlDnqUvgs0FypnlrmrLzXvzlNTqSQB0",
    authDomain: "nova-editings.firebaseapp.com",
    projectId: "nova-editings",
    appId: "1:951695956594:web:2dca790f249ec09a97c0eb"
};

// ✅ INIT ONCE ONLY
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// GOOGLE LOGIN
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            auth.onAuthStateChanged(user => {
                if (user) {
                    window.location.href = "role-selection.html";
                }
            });
        })
        .catch(err => alert(err.message));
}
