console.log("post-job.js loaded");

document.getElementById("jobForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("User not logged in");
        return;
    }

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const contentType = document.getElementById("contentType").value;
    const deadline = document.getElementById("deadline").value;

    console.log("Submitting job:", {
        title, description, contentType, deadline
    });

    try {
        const ref = await db.collection("jobs").add({
            clientId: user.uid,
            title,
            description,
            contentType,
            deadline,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("Job saved with ID:", ref.id);
        alert("Job submitted successfully");

        window.location.href = "client-dashboard.html";
    } catch (err) {
        console.error("Firestore error:", err);
        alert(err.message);
    }
});
