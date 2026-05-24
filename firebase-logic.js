// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTqUNumM7pZ8fVxR6FJJtWTjEJBAaoUC8",
  authDomain: "atlaslearningportal.firebaseapp.com",
  projectId: "atlaslearningportal",
  storageBucket: "atlaslearningportal.firebasestorage.app",
  messagingSenderId: "801489327302",
  appId: "1:801489327302:web:4ef40c86e0eb27d1fc33c7",
  measurementId: "G-L8SCH3Q1MR"
};

// -----------------------------
// GLOBAL STATE
// -----------------------------
let auth1, db;
let currentUser = null;
let currentUserRole = null;
let currentUserData = null;

// -----------------------------
// FIREBASE INIT
// -----------------------------
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return;
  }

  firebase.initializeApp(firebaseConfig);

  auth1 = firebase.auth();
  db = firebase.firestore();

  console.log('Firebase initialized');

  auth1.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;

      try {
        const snap = await db.collection('users').doc(user.uid).get();
        if (snap.exists) {
          currentUserData = snap.data();
          currentUserRole = currentUserData.role;
        }
      } catch (err) {
        console.error(err);
      }

    } else {
      currentUser = null;
      currentUserRole = null;
      currentUserData = null;
    }
  });
}

// -----------------------------
// ROLE SELECT
// -----------------------------
function setRole(role) {
  document.getElementById('role-student').classList.toggle('active', role === 'student');
  document.getElementById('role-teacher').classList.toggle('active', role === 'teacher');

  sessionStorage.setItem('selectedRole', role);
}

// -----------------------------
// LOGIN
// -----------------------------
async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const selectedRole = sessionStorage.getItem('selectedRole') || 'student';

  if (!email || !password) return showError("Enter email & password");

  try {
    const cred = await auth1.signInWithEmailAndPassword(email, password);
    const user = cred.user;

    const snap = await db.collection('users').doc(user.uid).get();

    if (!snap.exists) {
      await auth1.signOut();
      return showError("User not found");
    }

    const data = snap.data();

    if (data.role !== selectedRole) {
      await auth1.signOut();
      return showError("Role mismatch");
    }

    currentUser = user;
    currentUserRole = data.role;
    currentUserData = data;

    if (data.role === 'teacher') {
      showPage('teacher');
      setTimeout(initTeacherDashboard, 200);
    } else {
      showPage('dashboard');
      setTimeout(initStudentDashboard, 200);
    }

  } catch (err) {
    showError(err.message);
  }
}

function showError(msg) {
  const el = document.getElementById('login-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

// -----------------------------
// LOGOUT
// -----------------------------
async function logout() {
  await auth1.signOut();
  currentUser = null;
  currentUserRole = null;
  currentUserData = null;

  showPage('login');
}

// -----------------------------
// STUDENT INIT
// -----------------------------
async function initStudentDashboard() {
  if (!currentUser) return;

  const ref = db.collection('student_progress').doc(currentUser.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      ankle: 0,
      knee: 0,
      terminology: 0,
      sectionsCompleted: {
        ankle: [],
        knee: [],
        terminology: []
      },
      userId: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  await loadStudentProgress();
}

// -----------------------------
// TEACHER INIT (UNCHANGED CORE LOGIC)
// -----------------------------
async function initTeacherDashboard() {
  if (!currentUser) return;

  const usersSnap = await db.collection('users').get();

  const students = [];

  for (const doc of usersSnap.docs) {
    const u = doc.data();
    if (u.role !== 'student') continue;

    const progSnap = await db.collection('student_progress').doc(doc.id).get();
    const prog = progSnap.exists ? progSnap.data() : {};

    students.push({
      id: doc.id,
      name: u.name,
      email: u.email,
      progress: prog
    });
  }

  renderTeacherStudents(students);
}

// -----------------------------
// UPDATE PROGRESS (MAIN LOGIC)
// -----------------------------
async function updateStudentProgress(chapter, sectionIndex) {
  if (!currentUser) return;

  try {
    const key = chapter.toLowerCase();

    const ref = db.collection('student_progress').doc(currentUser.uid);
    const snap = await ref.get();

    if (!snap.exists) return;

    const data = snap.data();

    const sectionsCompleted = data.sectionsCompleted || {
      ankle: [],
      knee: [],
      terminology: []
    };

    if (!sectionsCompleted[key]) sectionsCompleted[key] = [];

    if (!sectionsCompleted[key].includes(sectionIndex)) {
      sectionsCompleted[key].push(sectionIndex);
    }

    const TOTAL = {
      ankle: 4,
      knee: 4,
      terminology: 3
    };

    const percent = Math.round(
      (sectionsCompleted[key].length / TOTAL[key]) * 100
    );

    const update = {
      ...data,
      sectionsCompleted,
      [key]: percent,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUser.uid
    };

    await ref.set(update, { merge: true });

    await loadStudentProgress();

  } catch (err) {
    console.error(err);
  }
}

// -----------------------------
// LOAD PROGRESS
// -----------------------------
async function loadStudentProgress() {
  if (!currentUser) return;

  const snap = await db.collection('student_progress')
    .doc(currentUser.uid)
    .get();

  if (!snap.exists) return;

  const data = snap.data();

  if (typeof progress !== 'undefined') {
    progress.completed.clear();
    progress.inProgress.clear();

    ['ankle', 'knee', 'terminology'].forEach((k) => {
      const val = data[k] || 0;

      if (val === 100) progress.completed.add(k);
      else if (val > 0) progress.inProgress.add(k);
    });

    updateAllProgressBars(data);
  }
}

// -----------------------------
// UI UPDATE
// -----------------------------
function updateAllProgressBars(data) {
  if (!data) return;

  ['ankle', 'knee', 'terminology'].forEach((key) => {
    const percent = data[key] || 0;

    document.querySelectorAll(`[onclick*="${key}"] .mini-fill`)
      .forEach((el) => {
        el.style.width = percent + '%';

        el.style.background =
          percent === 100 ? 'var(--green)' :
          percent > 0 ? 'var(--royal)' :
          '#ddd';
      });
  });
}

// -----------------------------
// HELPER UI
// -----------------------------
function renderTeacherStudents(students) {
  const el = document.getElementById('teacher-student-list');
  if (!el) return;

  el.innerHTML = students.map(s => {
    const a = s.progress.ankle || 0;
    const k = s.progress.knee || 0;
    const t = s.progress.terminology || 0;

    const avg = Math.round((a + k + t) / 3);

    return `
      <div class="teacher-student-card">
        <div>${s.name}</div>
        <div>${avg}%</div>
      </div>
    `;
  }).join('');
}

// -----------------------------
// EXPORTS
// -----------------------------
window.handleLogin = handleLogin;
window.logout = logout;
window.setRole = setRole;
window.updateStudentProgress = updateStudentProgress;
window.initStudentDashboard = initStudentDashboard;
window.initTeacherDashboard = initTeacherDashboard;
window.loadStudentProgress = loadStudentProgress;
window.updateAllProgressBars = updateAllProgressBars;

// -----------------------------
// BOOT
// -----------------------------
function setupEventListeners() {
  initFirebase();

  document.getElementById('role-student')?.addEventListener('click', () => setRole('student'));
  document.getElementById('role-teacher')?.addEventListener('click', () => setRole('teacher'));
  document.getElementById('login-btn')?.addEventListener('click', handleLogin);
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

window.addEventListener('load', setupEventListeners);