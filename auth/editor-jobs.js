

auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadAssignedJobs(user.uid);
});

async function loadAssignedJobs(editorId) {
    const jobsList = document.getElementById("jobsList");
    jobsList.innerHTML = "";

    const snapshot = await db
        .collection("jobs")
        .where("assignedEditorId", "==", editorId)
        .orderBy("createdAt", "desc")
        .get();

    if (snapshot.empty) {
        jobsList.innerHTML = "<p>No jobs assigned yet.</p>";
        return;
    }

    snapshot.forEach(doc => {
        const job = doc.data();

        const div = document.createElement("div");
        div.className = "job";

        div.innerHTML = `
            <span class="status">${job.status}</span>
            <h3>${job.title}</h3>
            <p><strong>Type:</strong> ${job.contentType}</p>
            <p><strong>Deadline:</strong> ${job.deadline || "Not specified"}</p>
            <p>${job.description}</p>
        `;

        jobsList.appendChild(div);
    });
}
