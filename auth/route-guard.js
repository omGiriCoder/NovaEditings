console.log("route-guard loaded");

const db = firebase.firestore();

/**
 * @param {string} requiredRole - "editor" or "client"
 */
function protectRoute(requiredRole) {
    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        try {
            const doc = await db.collection("users").doc(user.uid).get();

            if (!doc.exists || !doc.data().role) {
                // No role selected yet
                window.location.href = "role-selection.html";
                return;
            }

            const userRole = doc.data().role;

            if (userRole !== requiredRole) {
                // Role mismatch → redirect correctly
                if (userRole === "editor") {
                    window.location.href = "editor-dashboard.html";
                } else {
                    window.location.href = "client-dashboard.html";
                }
            }

            // ✅ Correct role → allow access
            console.log("Access granted for role:", userRole);

        } catch (error) {
            console.error("Route guard error:", error);
        }
    });
}
