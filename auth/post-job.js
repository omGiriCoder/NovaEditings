const db = firebase.firestore();

document.getElementById("jobForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    const jobData = {
        clientId: user.uid,
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        contentType: document.getElementById("contentType").value,
        deadline: document.getElementById("deadline").value,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("jobs").add(jobData);
        alert("Job submitted successfully");
        window.location.href = "client-dashboard.html";
    } catch (error) {
        alert(error.message);
    }
});
