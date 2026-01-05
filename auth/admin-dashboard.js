const ADMIN_EMAIL = "omgoswami4114@gmail.com"; // <-- CHANGE THIS

const db = firebase.firestore();

// 🔐 Admin-only access
auth.onAuthStateChanged(user => {
    if (!user || user.email !== ADMIN_EMAIL) {
        alert("Access denied");
        window.location.href = "login.html";
        return;
    }

    loadJobs();
});

async function loadJobs() {
    const jobsList = document.getElementById("jobsList");
    jobsList.innerHTML = "";

    const snapshot = await db.collection("jobs").orderBy("createdAt", "desc").get();

    snapshot.forEach(doc => {
        const job = doc.data();

        const div = document.createElement("div");
        div.className = "job";

        div.innerHTML = `
            <h3>${job.title}</h3>
            <p><strong>Type:</strong> ${job.contentType}</p>
            <p><strong>Status:</strong> ${job.status}</p>
            <p>${job.description}</p>

            <div class="assign">
                <input type="text" placeholder="Editor UID / Name" id="editor-${doc.id}">
                <select id="status-${doc.id}">
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                </select>
                <button onclick="assignJob('${doc.id}')">Update</button>
            </div>
        `;

        jobsList.appendChild(div);
    });
}

async function assignJob(jobId) {
    const editorInput = document.getElementById(`editor-${jobId}`).value;
    const status = document.getElementById(`status-${jobId}`).value;

    if (!editorInput) {
        alert("Enter editor UID or name");
        return;
    }

    await db.collection("jobs").doc(jobId).update({
        assignedEditorId: editorInput,
        status: status
    });

    alert("Job updated");
    loadJobs();
}
