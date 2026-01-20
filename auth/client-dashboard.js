// NOTE: this file expects `auth` and `db` to be available globally (from firebase-auth.js).
let currentUser = null;
const content = document.getElementById("content");
let jobsUnsub = null; // for real-time listener

/* ---------- UI helpers ---------- */
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"),3000);
}
function formatDate(d){ if(!d) return "—"; try{ const dt=new Date(d); return dt.toLocaleDateString(); } catch(e){ return d } }

/* ---------- AUTH READY ---------- */
auth.onAuthStateChanged(async user => {
  if (!user) return;
  currentUser = user;

  // default view
  setupNav();
  loadView("overview");
});

/* ---------- NAV ---------- */
function setupNav(){
  document.querySelectorAll(".nav-link").forEach(link=>{
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      document.querySelectorAll(".nav-link").forEach(l=>l.classList.remove("active"));
      link.classList.add("active");
      const view = link.dataset.view;
      loadView(view);
    });
  });

  const lb = document.getElementById("logoutBtn");
  lb && lb.addEventListener("click", ()=>{ auth.signOut().then(()=> location.href="login.html"); });
}

/* ---------- VIEW ROUTER ---------- */
function loadView(view){
  // detach realtime listener when switching away from jobs
  if(jobsUnsub){ jobsUnsub(); jobsUnsub = null; }

  if(view === "overview") return loadOverview();
  if(view === "post") return renderPostForm();
  if(view === "jobs") return renderPostedJobsRealtime();
  if(view === "settings") return renderSettings();

  // default
  loadOverview();
}

/* ---------- OVERVIEW ---------- */
async function loadOverview(){
  // counts: total posted, in progress (assigned/in_progress), payment pending (delivered & paymentStatus pending)
  const base = db.collection("jobs").where("clientId","==", currentUser.uid);

  const snapAll = await base.get();
  const total = snapAll.size;

  const snapInProgress = await base.where("status","in", ["assigned","in_progress"]).get();
  const inProgress = snapInProgress.size;

  const snapPendingPayment = await base.where("status","==","delivered").where("paymentStatus","==","pending").get();
  const paymentPending = snapPendingPayment.size;

  content.innerHTML = `
    <h1>Welcome 👋</h1>
    <p class="subtitle">Manage your projects — track status, deadlines, budgets and approvals.</p>

    <div class="cards">
      <div class="card"><h3>${total}</h3><p class="small">Total Jobs</p></div>
      <div class="card"><h3>${inProgress}</h3><p class="small">In Progress</p></div>
      <div class="card"><h3>${paymentPending}</h3><p class="small">Payment Pending</p></div>
    </div>

    <div class="card">
      <h3>Quick actions</h3>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn" onclick="document.querySelector('[data-view=\"post\"]').click()">Post New Job</button>
        <button class="btn ghost" onclick="document.querySelector('[data-view=\"jobs\"]').click()">View My Jobs</button>
      </div>
    </div>
  `;
}

/* ---------- POST FORM (on same page) ---------- */
function renderPostForm(){
  content.innerHTML = `
    <h1>Post a New Job</h1>
    <p class="subtitle">Good briefs get better matches — be clear and add a deadline & budget.</p>

    <div class="card">
      <input id="pj_title" type="text" placeholder="Job title (e.g. YouTube Long-Form Edit)" />
      <textarea id="pj_description" placeholder="Describe your requirements, references, timing, tone, deliverables"></textarea>

      <select id="pj_type">
        <option value="">Select type (e.g. YouTube, Reels, Ads)</option>
        <option value="youtube">YouTube long-form</option>
        <option value="reels">Reels / Shorts</option>
        <option value="ads">Ads / Promo</option>
        <option value="other">Other</option>
      </select>

      <div class="row">
        <div class="half"><input id="pj_budget" type="number" placeholder="Budget (₹)" /></div>
        <div class="half"><input id="pj_deadline" type="date" /></div>
      </div>

      <input id="pj_reference" type="text" placeholder="Reference link (optional)" />

      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn" onclick="postJob()">Post Job</button>
        <button class="btn ghost" onclick="clearPostForm()">Clear</button>
      </div>
    </div>
  `;
}

function clearPostForm(){
  ['pj_title','pj_description','pj_type','pj_budget','pj_deadline','pj_reference'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
}

/* ---------- POST ACTION ---------- */
async function postJob(){
  const title = (document.getElementById('pj_title')||{}).value?.trim();
  const description = (document.getElementById('pj_description')||{}).value?.trim();
  const type = (document.getElementById('pj_type')||{}).value;
  const budget = Number((document.getElementById('pj_budget')||{}).value || 0);
  const deadline = (document.getElementById('pj_deadline')||{}).value;
  const reference = (document.getElementById('pj_reference')||{}).value?.trim();

  if(!title || !description || !type || !budget || !deadline){
    alert('Please fill title, description, type, budget and deadline');
    return;
  }

  try {
    await db.collection('jobs').add({
      title,
      description,
      type,
      budget,
      deadline,
      reference: reference || null,
      clientId: currentUser.uid,
      status: 'new',           // standard initial state
      paymentStatus: null,
      assignedEditorId: null,
      assignedEditorName: null,
      clientApproved: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast('Job posted');
    clearPostForm();
    // go to posted jobs view
    document.querySelector('[data-view="jobs"]').click();
  } catch(err){
    console.error(err);
    alert(err.message || 'Failed to post job');
  }
}

/* ---------- POSTED JOBS (real-time) ---------- */
function renderPostedJobsRealtime(){
  content.innerHTML = `<h1>My Posted Jobs</h1><p class="subtitle">Manage posted jobs — delete if not assigned, approve delivered work.</p>
    <div id="jobsHolder"></div>`;

  const holder = document.getElementById('jobsHolder');

  // unsubscribe existing
  if(jobsUnsub) { jobsUnsub(); jobsUnsub = null; }

  jobsUnsub = db.collection('jobs')
    .where('clientId','==',currentUser.uid)
    .orderBy('createdAt','desc')
    .onSnapshot(snapshot=>{
      if(snapshot.empty){
        holder.innerHTML = `<p style="opacity:.6">No jobs posted yet.</p>`;
        return;
      }

      let html = '';
      snapshot.forEach(doc=>{
        const job = doc.data();
        const id = doc.id;

        html += `
          <div class="job">
            <h3>${escapeHtml(job.title)}</h3>
            <p class="small">${escapeHtml(job.description)}</p>

            <div class="job-meta">
              <div><strong>Budget:</strong> ₹${job.budget || 0}</div>
              <div><strong>Deadline:</strong> ${job.deadline ? escapeHtml(job.deadline) : '—'}</div>
              <div><strong>Type:</strong> ${escapeHtml(job.type || '—')}</div>
              <div><strong>Editor:</strong> ${job.assignedEditorName || 'Not assigned'}</div>
            </div>

            <div style="margin-top:10px">
              <span class="badge ${escapeHtml(job.status || 'new')}">${(job.status||'new').replace('_',' ')}</span>
              ${job.status === 'delivered' ? `<span style="margin-left:8px" class="badge ${job.paymentStatus === 'paid' ? 'delivered' : 'pending'}">${job.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}</span>` : ''}
            </div>

            <div class="job-actions">
              ${job.status === 'new' ? `<button class="btn ghost danger" onclick="deleteJob('${id}')">Delete</button>` : ''}
              ${job.status === 'delivered' ? `<button class="btn" onclick="approveDelivery('${id}')">Approve Delivery</button>` : ''}
            </div>
          </div>
        `;
      });

      holder.innerHTML = html;
    }, err=>{
      console.error('snapshot err', err);
      holder.innerHTML = `<p style="opacity:.6">Unable to load jobs.</p>`;
    });
}

/* ---------- DELETE JOB ---------- */
async function deleteJob(jobId){
  if(!confirm('Delete this job? This cannot be undone.')) return;
  try {
    await db.collection('jobs').doc(jobId).delete();
    showToast('Job deleted');
  } catch(err){
    console.error(err);
    alert(err.message || 'Failed to delete');
  }
}

/* ---------- APPROVE DELIVERY (client) ---------- */
async function approveDelivery(jobId){
  if(!confirm('Approve this delivery? Approving means you accept the work.')) return;
  try {
    await db.collection('jobs').doc(jobId).update({
      clientApproved: true,
      clientApprovedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Delivery approved');
  } catch(err){
    console.error(err);
    alert(err.message || 'Failed to approve');
  }
}

/* ---------- SETTINGS ---------- */
function renderSettings(){
  content.innerHTML = `
    <h1>Settings</h1>
    <p class="small">Account & billing controls coming soon.</p>
  `;
}

/* ---------- UTILS ---------- */
function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
