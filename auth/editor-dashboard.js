let currentUser = null;
const content = document.getElementById("content");

/* ---------- AUTH READY ---------- */
auth.onAuthStateChanged(user => {
  if (!user) return;

  currentUser = user;
  loadView("overview"); // load only AFTER user exists
});

/* ---------- SIDEBAR NAV ---------- */
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    loadView(link.dataset.view);
  });
});

/* ---------- VIEW LOADER ---------- */
function loadView(view) {
  if (!currentUser) return;

  if (view === "overview") loadOverview();
  if (view === "jobs") loadJobs();
  if (view === "portfolio") content.innerHTML = `<h2>Portfolio</h2><p>Coming soon</p>`;
  if (view === "profile") content.innerHTML = `<h2>Profile</h2><p>Coming soon</p>`;
}

/* ---------- OVERVIEW ---------- */
async function loadOverview() {
  const snap = await db
    .collection("jobs")
    .where("assignedEditorId", "==", currentUser.uid)
    .get();

  let active = 0;
  let delivered = 0;

  snap.forEach(doc => {
    doc.data().status === "delivered" ? delivered++ : active++;
  });

  content.innerHTML = `
    <h1>Welcome 👋</h1>

    <div class="cards">
      <div class="card">
        <h3>${active}</h3>
        <p>Active Jobs</p>
      </div>

      <div class="card">
        <h3>${delivered}</h3>
        <p>Delivered Jobs</p>
      </div>
    </div>
  `;
}

/* ---------- JOBS ---------- */
async function loadJobs() {
  const snap = await db
    .collection("jobs")
    .where("assignedEditorId", "==", currentUser.uid)
    .get();

  if (snap.empty) {
    content.innerHTML = `<p>No jobs assigned yet.</p>`;
    return;
  }

  let activeHTML = `<h2>Active Jobs</h2>`;
  let deliveredHTML = `<h2 style="margin-top:40px">Delivered by Me</h2>`;

  let hasActive = false;
  let hasDelivered = false;

  snap.forEach(doc => {
    const job = doc.data();

    /* ACTIVE */
    if (job.status !== "delivered") {
      hasActive = true;
      activeHTML += `
        <div class="job">
          <h3>${job.title}</h3>
          <p>${job.description}</p>

          <div class="job-actions">
            <button class="in-progress"
              onclick="updateStatus('${doc.id}','in_progress')">
              Mark In Progress
            </button>

            <button class="delivered"
              onclick="updateStatus('${doc.id}','delivered')">
              Mark Delivered
            </button>
          </div>
        </div>
      `;
    }

    /* DELIVERED */
    if (job.status === "delivered" && job.deliveredByEditor) {
      hasDelivered = true;
      deliveredHTML += `
        <div class="job">
          <h3>${job.title}</h3>
          <p>${job.description}</p>
          <span class="badge ${job.paymentStatus === "paid" ? "delivered" : "pending"}">
  ${job.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
</span>

        </div>
      `;
    }
  });

  if (!hasActive) activeHTML += `<p style="opacity:.6">No active jobs.</p>`;
  if (!hasDelivered) deliveredHTML += `<p style="opacity:.6">No delivered jobs.</p>`;

  content.innerHTML = activeHTML + deliveredHTML;
}

/* ---------- STATUS UPDATE ---------- */
async function updateStatus(jobId, status) {
  const updates = {
    status,
    editorUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (status === "delivered") {
    updates.deliveredByEditor = true;
    updates.paymentStatus = "pending";
  }

  await db.collection("jobs").doc(jobId).update(updates);

  showToast(
    status === "delivered"
      ? "Marked delivered. Payment pending."
      : "Status updated."
  );

  loadJobs();
}

/* ---------- TOAST ---------- */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ---------- LOGOUT ---------- */
document.getElementById("logoutBtn").onclick = () => {
  auth.signOut().then(() => location.href = "login.html");
};
