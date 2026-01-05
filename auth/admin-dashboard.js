

const db = firebase.firestore();

// 🔐 Admin-only access
auth.onAuthStateChanged(user => {
    if (!user) {
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
    <p><strong>Client ID:</strong> ${job.clientId}</p>
    <p><strong>Type:</strong> ${job.contentType}</p>
    <p><strong>Status:</strong> ${job.status}</p>
    <p>${job.description}</p>

    <div class="assign">
        <input type="text" placeholder="Editor UID" id="editor-${doc.id}">
        <select id="status-${doc.id}">
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="delivered">Delivered</option>
        </select>
        <button onclick="assignJob('${doc.id}')">Update Job</button>
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

    const jobRef = db.collection("jobs").doc(jobId);
    const jobSnap = await jobRef.get();
    const jobData = jobSnap.data();

    // Update job
    await jobRef.update({
        assignedEditorId: editorInput,
        status: status
    });

    // 🔔 SEND EMAIL TO CLIENT
    sendClientEmail(jobData.clientId, jobData.title, status);

    alert("Job updated & client notified");
    loadJobs();
}

async function sendClientEmail(clientId, jobTitle, status) {
    const userSnap = await db.collection("users").doc(clientId).get();
    const clientEmail = userSnap.data().email;

    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
        client_email: clientEmail,
        job_title: jobTitle,
        job_status: status
    });
}

