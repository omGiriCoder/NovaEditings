let editorsCache = [];


const content = document.getElementById("content");
let currentView = "new";

/* ---------- NAV ---------- */
document.querySelectorAll(".nav-link").forEach(link => {
  link.onclick = () => {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    currentView = link.dataset.view;
    loadView();
  };
});

/* ---------- AUTH ---------- */
auth.onAuthStateChanged(user => {
  if (!user) return;
  loadEditors();
  loadView();
});

/* ---------- VIEW ROUTER ---------- */
function loadView() {
  if (currentView === "new") loadNewJobs();
  if (currentView === "progress") loadInProgress();
  if (currentView === "payments") loadPendingPayments();
  if (currentView === "completed") loadCompleted();
  if (currentView === "settings") loadSettings();
}

/* ---------- NEW JOBS ---------- */
async function loadNewJobs() {
  const snap = await db
    .collection("jobs")
    .where("status", "==", "new")
    .get();

  content.innerHTML = `<h2>New Jobs</h2>`;

  if (snap.empty) {
    content.innerHTML += `<p style="opacity:.6">No new jobs.</p>`;
    return;
  }

  snap.forEach(doc => {
    const job = doc.data(); // ✅ THIS WAS MISSING

    const options = editorsCache
      .map(e => `<option value="${e.id}">${e.name}</option>`)
      .join("");

    content.innerHTML += `
      <div class="job">
        <h3>${job.title}</h3>
        <p>${job.description}</p>

        <select id="editor-${doc.id}">
          <option value="">Select Editor</option>
          ${options}
        </select>

        <button class="assign" onclick="assignJob('${doc.id}')">
          Assign
        </button>
      </div>
    `;
  });
}

/* ---------- IN PROGRESS ---------- */
async function loadInProgress() {
  const snap = await db.collection("jobs")
    .where("status", "in", ["assigned", "in_progress"])
    .get();

  content.innerHTML = `<h2>In Progress</h2>`;

  snap.forEach(doc => {
    const job = doc.data();
    content.innerHTML += `
      <div class="job">
        <h3>${job.title}</h3>
        <p>Editor: ${job.assignedEditorName || "—"}</p>
        <p>Status: ${job.status}</p>
      </div>
    `;
  });
}

/* ---------- PENDING PAYMENTS ---------- */
async function loadPendingPayments() {
  const snap = await db.collection("jobs")
    .where("status", "==", "delivered")
    .where("paymentStatus", "==", "pending")
    .get();

  content.innerHTML = `<h2>Pending Payments</h2>`;

  snap.forEach(doc => {
    const job = doc.data();
    content.innerHTML += `
      <div class="job">
        <h3>${job.title}</h3>
        <p>Editor delivered</p>
        <button class="pay" onclick="markAsPaid('${doc.id}')">Mark as Paid</button>
      </div>
    `;
  });
}

/* ---------- COMPLETED ---------- */
async function loadCompleted() {
  const snap = await db.collection("jobs")
    .where("paymentStatus", "==", "paid")
    .get();

  content.innerHTML = `<h2>Completed Jobs</h2>`;

  snap.forEach(doc => {
    const job = doc.data();
    content.innerHTML += `
      <div class="job">
        <h3>${job.title}</h3>
        <p>Payment Completed</p>
      </div>
    `;
  });
}

/* ---------- ACTIONS ---------- */
async function assignJob(jobId) {
  const select = document.getElementById(`editor-${jobId}`);
  const editorId = select.value;

  if (!editorId) {
    alert("Select an editor first");
    return;
  }

  const editor = editorsCache.find(e => e.id === editorId);

  await db.collection("jobs").doc(jobId).update({
    assignedEditorId: editorId,
    assignedEditorName: editor.name,
    status: "assigned"
  });

  showToast(`Assigned to ${editor.name}`);
  loadView();
}


async function markAsPaid(jobId) {
  await db.collection("jobs").doc(jobId).update({
    paymentStatus: "paid",
    paidAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  showToast("Payment marked as PAID");
  loadView();
}

/* ---------- SETTINGS ---------- */
function loadSettings() {
  content.innerHTML = `
    <h2>Settings</h2>
    <p>Admin tools coming soon.</p>
  `;
}

/* ---------- TOAST ---------- */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

async function loadEditors() {
  const snap = await db
    .collection("users")
    .where("role", "==", "editor")
    .get();

  editorsCache = snap.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || "Unnamed Editor"
  }));
}


/* ---------- LOGOUT ---------- */
document.getElementById("logoutBtn").onclick = () => {
  auth.signOut().then(() => location.href = "login.html");
};
