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

// Initialize Firebase (using global firebase object from CDN)

// Single source of truth for all module keys (mirrors MODULE_KEYS in index.html)
const FIREBASE_MODULE_KEYS = ['terminology','ankle','knee','shoulder','wrist','taping','woundcare','concussions','allergic','heat','bloodborne','emergencyplan','modalities','asthma','diabetes','adolescent'];

let auth1, db;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded from CDN');
    return;
  }
  
  firebase.initializeApp(firebaseConfig);
  auth1 = firebase.auth();
  db = firebase.firestore();
  console.log('Firebase initialized');
  
  
  // Set up auth state listener after Firebase is initialized
  auth1.onAuthStateChanged(async (user) => {
    if (user) {
      console.log('User signed in:', user.uid);
      currentUser = user;
      try {
        const userDocSnap = await db.collection('users').doc(user.uid).get();
        if (userDocSnap.exists) {
          currentUserData = userDocSnap.data();
          currentUserRole = currentUserData.role;
          console.log('User role:', currentUserRole);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    } else {
      console.log('User signed out');
      currentUser = null;
      currentUserRole = null;
      currentUserData = null;
    }
  });
}

// Global state
let currentUser = null;
let currentUserRole = null;
let currentUserData = null;

// Set role (UI only, for demo)
function setRole(role) {
  document.getElementById('role-student').classList.toggle('active', role === 'student');
  document.getElementById('role-teacher').classList.toggle('active', role === 'teacher');
  document.getElementById('role-student').style.background = role === 'student' ? 'var(--royal)' : 'var(--border)';
  document.getElementById('role-student').style.color = role === 'student' ? '#fff' : 'var(--text)';
  document.getElementById('role-teacher').style.background = role === 'teacher' ? 'var(--royal)' : 'var(--border)';
  document.getElementById('role-teacher').style.color = role === 'teacher' ? '#fff' : 'var(--text)';
  sessionStorage.setItem('selectedRole', role);
}

// Handle login
async function handleLogin() {
  console.log('Login button clicked');
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const selectedRole = sessionStorage.getItem('selectedRole') || 'student';
  const errorDiv = document.getElementById('login-error');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }

  try {
    console.log('Attempting login with:', email);
    
    // Sign in with Firebase Auth
    const userCredential = await auth1.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log('Auth successful, UID:', user.uid);

    // Get user data from Firestore
    const userDocSnap = await db.collection('users').doc(user.uid).get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      console.log('User data found:', userData);
      
      // Verify role matches
      if (userData.role !== selectedRole) {
        console.warn(`Role mismatch: User role is '${userData.role}' but selected role is '${selectedRole}'`);
        showError(`This account is registered as a ${userData.role}, not a ${selectedRole}`);
        await auth1.signOut();
        return;
      }

      // Login successful
      currentUser = user;
      currentUserRole = userData.role;
      currentUserData = userData;

      // Update UI
      const navMain = document.getElementById('nav-main');
      const navAuth = document.getElementById('nav-auth');
      const userNameDisplay = document.getElementById('user-name-display');
      const studentDashboardLink = document.getElementById('nav-student-dashboard');
      const teacherDashboardLink = document.getElementById('nav-teacher-dashboard');
      
      if (navMain) navMain.style.display = 'flex';
      if (navAuth) navAuth.style.display = 'flex';
      if (userNameDisplay) userNameDisplay.textContent = userData.name || email.split('@')[0];
      
      // Show/hide dashboard links based on role
      if (studentDashboardLink) studentDashboardLink.style.display = userData.role === 'student' ? 'block' : 'none';
      if (teacherDashboardLink) teacherDashboardLink.style.display = userData.role === 'teacher' ? 'block' : 'none';
      const studentViewLink = document.getElementById('nav-student-view');
      if (studentViewLink) studentViewLink.style.display = userData.role === 'teacher' ? 'inline-flex' : 'none';

      // Hide login page
      const loginPage = document.getElementById('page-login');
      if (loginPage) {
        loginPage.classList.remove('active');
        loginPage.style.display = 'none';
      }
      if (errorDiv) errorDiv.style.display = 'none';

      // Show appropriate dashboard
      if (userData.role === 'teacher') {
        console.log('Routing to teacher dashboard');
        showPage('teacher');
        // Use setTimeout to ensure page is rendered before initializing
        setTimeout(() => {
          console.log('Now calling initTeacherDashboard after page render');
          initTeacherDashboard();
        }, 200);
      } else {
        console.log('Routing to student dashboard');
        showPage('dashboard');
        // Use setTimeout to ensure page is rendered before initializing
        setTimeout(() => {
          console.log('Now calling initStudentDashboard after page render');
          initStudentDashboard();
        }, 200);
      }
      
      console.log('Login successful for', userData.role);
    } else {
      showError('User profile not found in database');
      await auth1.signOut();
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Login failed: ' + error.message);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  console.error(message);
}

// Logout function
async function logout() {
  try {
    await auth1.signOut();
    currentUser = null;
    currentUserRole = null;
    currentUserData = null;
    
    // Reset UI
    const navMain = document.getElementById('nav-main');
    const navAuth = document.getElementById('nav-auth');
    const loginPage = document.getElementById('page-login');
    const studentDashboardLink = document.getElementById('nav-student-dashboard');
    const teacherDashboardLink = document.getElementById('nav-teacher-dashboard');
    
    if (navMain) navMain.style.display = 'flex';
    if (navAuth) navAuth.style.display = 'none';
    if (loginPage) loginPage.classList.add('active');
    if (studentDashboardLink) studentDashboardLink.style.display = 'block';
    if (teacherDashboardLink) teacherDashboardLink.style.display = 'none';
    const studentViewLink = document.getElementById('nav-student-view');
    if (studentViewLink) studentViewLink.style.display = 'none';
    if (typeof isTeacherPreviewMode !== 'undefined' && isTeacherPreviewMode) { isTeacherPreviewMode = false; }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    if (loginPage) loginPage.style.display = 'flex';
    
    // Clear form
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Initialize student dashboard
async function initStudentDashboard() {
  try {
    if (!currentUser) {
      console.warn('Cannot init student dashboard - no current user');
      return;
    }
    
    console.log('Initializing student dashboard for:', currentUser.uid);
    
    // Ensure progress document exists in Firestore
    const progressRef = db.collection('student_progress').doc(currentUser.uid);
    const progressSnap = await progressRef.get();
    
    if (!progressSnap.exists) {
      // Create initial progress document with all module keys at 0
      console.log('Creating new progress document for user:', currentUser.uid);
      const initialProgress = {};
      FIREBASE_MODULE_KEYS.forEach(key => { initialProgress[key] = 0; });
      initialProgress.userId = currentUser.uid;
      initialProgress.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await progressRef.set(initialProgress);
      console.log('Progress document created');
    }
    
    // Load student's progress from Firestore
    await loadStudentProgress();
    
  } catch (error) {
    console.error('Error initializing student dashboard:', error);
  }
}

// Initialize teacher dashboard - UPDATED WITH PROPER FIRESTORE RULES
async function initTeacherDashboard() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('🎓 Initializing Teacher Dashboard...');
    console.log('═══════════════════════════════════════');
    
    if (!currentUser) {
      console.error('❌ Cannot init teacher dashboard - no current user');
      const studentListEl = document.getElementById('teacher-student-list');
      if (studentListEl) {
        studentListEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.88rem;grid-column:1/-1;">⚠️ Error: User not authenticated</div>';
      }
      return;
    }

    console.log('👤 Current user:', currentUser.uid);
    console.log('🔄 Fetching all documents from users collection...');
    
    // This will work if Firestore rules allow teachers to read the users collection
    // The rule needed is: match /users/{document=**} { allow read: if request.auth != null; }
    let usersSnapshot;
    try {
      usersSnapshot = await db.collection('users').get();
      console.log('✅ Users snapshot received:', usersSnapshot.docs.length, 'documents');
    } catch (firestoreError) {
      console.error('❌ Firestore error:', firestoreError.code, firestoreError.message);
      const studentListEl = document.getElementById('teacher-student-list');
      if (studentListEl) {
        studentListEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.88rem;grid-column:1/-1;">⚠️ Firestore Error: ${firestoreError.message}</div>`;
      }
      throw firestoreError;
    }
    
    const students = [];
    let totalProgress = 0;

    // Iterate through all users and find students
    for (const docSnap of usersSnapshot.docs) {
      const userData = docSnap.data();
      const userId = docSnap.id;
      
      console.log(`📝 Processing user ${userId}:`, userData.role);
      
      // Only process students
      if (userData.role !== 'student') {
        console.log(`⏭️  Skipping non-student: ${userData.email} (role: ${userData.role})`);
        continue;
      }
      
      try {
        // Get student's progress
        const progressSnap = await db.collection('student_progress').doc(userId).get();
        const progress = progressSnap.exists ? progressSnap.data() : {};
        
        console.log(`📊 Student ${userData.email} progress:`, progress);
        
        students.push({
          id: userId,
          name: userData.name || userData.email,
          email: userData.email,
          progress: progress
        });
        
        const moduleSum = FIREBASE_MODULE_KEYS.reduce((sum, key) => sum + (progress[key] || 0), 0);
        totalProgress += moduleSum / FIREBASE_MODULE_KEYS.length;
      } catch (progressError) {
        console.error(`❌ Error fetching progress for ${userId}:`, progressError);
        // Still add student but with zero progress
        students.push({
          id: userId,
          name: userData.name || userData.email,
          email: userData.email,
          progress: {}
        });
      }
    }

    console.log(`✅ Found ${students.length} students`);

    if (students.length === 0) {
      console.warn('⚠️  No students found! Make sure:');
      console.warn('  1. Students exist in the "users" collection');
      console.warn('  2. Their role field is set to "student"');
      console.warn('  3. Firestore security rules allow reading');
      const studentListEl = document.getElementById('teacher-student-list');
      if (studentListEl) {
        studentListEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.88rem;grid-column:1/-1;">📭 No students found. Check Firestore database.</div>`;
      }
    }

    const avgProgress = students.length > 0 ? Math.round(totalProgress / students.length) : 0;

    // Update stats
    const totalStudentsEl = document.getElementById('teacher-total-students');
    const activeNowEl = document.getElementById('teacher-active-now');
    const avgProgressEl = document.getElementById('teacher-avg-progress');
    
    console.log('📈 Updating stats elements...');
    
    if (totalStudentsEl) {
      totalStudentsEl.textContent = students.length;
      console.log('✅ Total students updated:', students.length);
    }
    if (activeNowEl) {
      activeNowEl.textContent = Math.max(1, Math.floor(students.length * 0.6));
      console.log('✅ Active now updated');
    }
    if (avgProgressEl) {
      avgProgressEl.textContent = avgProgress + '%';
      console.log('✅ Avg progress updated:', avgProgress);
    }

    // Title lookup for chapter progress display (mirrors MODULES config in index.html)
    const MODULE_TITLES = {
      terminology: 'Medical Terms', ankle: 'Ankle Anatomy', knee: 'Knee Anatomy',
      shoulder: 'Shoulder Anatomy', wrist: 'Wrist Anatomy',
      taping: 'Basic Taping', woundcare: 'Basic Wound Care', concussions: 'Concussions',
      allergic: 'Allergic Reactions', heat: 'Heat-Related Health Problems',
      bloodborne: 'Bloodborne Pathogens', emergencyplan: 'Emergency Plan', modalities: 'Modalities',
      asthma: 'Exercise-Induced Asthma', diabetes: 'The Athlete with Diabetes',
      adolescent: 'Special Medical Concerns for Adolescent Athletes',
    };

    // Populate student list with cards
    const studentListHTML = students.map(s => {
      const moduleSum = FIREBASE_MODULE_KEYS.reduce((sum, key) => sum + (s.progress[key] || 0), 0);
      const overallPercent = Math.round(moduleSum / FIREBASE_MODULE_KEYS.length);
      
      // Determine status color
      let statusColor = '#e03131'; // red
      let statusLabel = 'Just Started';
      if (overallPercent >= 75) {
        statusColor = '#2f9e44'; // green
        statusLabel = 'Nearly Complete';
      } else if (overallPercent >= 50) {
        statusColor = '#f59f00'; // yellow
        statusLabel = 'In Progress';
      } else if (overallPercent > 0) {
        statusColor = '#1a3db5'; // blue
        statusLabel = 'Started';
      }
      
      const studentName = s.name && s.name !== 'undefined' ? s.name : s.email.split('@')[0];

      const chapterItemsHTML = FIREBASE_MODULE_KEYS.map(key => {
        const pct = s.progress[key] || 0;
        const title = MODULE_TITLES[key] || key;
        return `
          <div class="teacher-chapter-item">
            <div class="teacher-chapter-header">
              <span class="teacher-chapter-name">${title}</span>
              <span class="teacher-chapter-percent">${pct}%</span>
            </div>
            <div class="teacher-mini-bar">
              <div class="teacher-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>`;
      }).join('');
      
      return `
      <div class="teacher-student-card">
        <div class="teacher-card-header">
          <div>
            <div class="teacher-card-name">${studentName}</div>
            <div class="teacher-card-email">${s.email}</div>
          </div>
          <div class="teacher-status-badge" style="background-color: ${statusColor};">${statusLabel}</div>
        </div>
        
        <div class="teacher-overall-progress">
          <div class="teacher-progress-percent">${overallPercent}%</div>
          <div style="flex: 1;">
            <div class="teacher-progress-label">Overall Progress</div>
            <div class="teacher-progress-bar">
              <div class="teacher-progress-fill" style="width: ${overallPercent}%;"></div>
            </div>
          </div>
        </div>
        
        <div class="teacher-chapter-title">Chapter Progress</div>
        
        <div>${chapterItemsHTML}
        </div>
      </div>
    `;
    }).join('');

    const studentListEl = document.getElementById('teacher-student-list');
    if (studentListEl) {
      studentListEl.innerHTML = studentListHTML || '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.88rem;">No students yet</div>';
      console.log('✓ Student list updated');
    } else {
      console.warn('Student list element not found!');
    }

    // Populate chapter details
    const CHAPTER_DESCRIPTIONS = {
      terminology: 'Essential medical terms used in athletic training.',
      ankle: 'The most common sports injury. Ligaments, sprains, and diagnosis.',
      knee: 'Complex joint with ACL, MCL, meniscus. Largest joint in the body.',
      shoulder: 'Ball-and-socket joint anatomy and common injuries.',
      wrist: 'Wrist anatomy and common athletic injuries.',
      taping: 'Basic taping techniques for common injuries.',
      woundcare: 'Wound assessment, cleaning, and basic care.',
      concussions: 'Recognition, response, and return-to-play protocols.',
      allergic: 'Recognizing and responding to allergic reactions.',
      heat: 'Heat illness prevention and emergency response.',
      bloodborne: 'Bloodborne pathogen safety and protocols.',
      emergencyplan: 'Emergency action plans for athletic venues.',
      modalities: 'Therapeutic modalities used in athletic training.',
      asthma: 'Exercise-induced asthma recognition and management.',
      diabetes: 'Supporting athletes managing diabetes.',
      adolescent: 'Special medical considerations for adolescent athletes.',
    };
    const chaptersHTML = FIREBASE_MODULE_KEYS.map((key, i) => `
      <div class="skill-card">
        <div class="skill-card-header">
          <div class="skill-icon" style="background:#e8edfb">📍</div>
          <span class="badge level2">Chapter ${i + 1}</span>
        </div>
        <h3>${MODULE_TITLES[key] || key}</h3>
        <p>${CHAPTER_DESCRIPTIONS[key] || ''}</p>
        <div class="skill-meta">
          <span>${students.length} students in class</span>
        </div>
      </div>`).join('');

    const chaptersEl = document.getElementById('teacher-chapters');
    if (chaptersEl) {
      chaptersEl.innerHTML = chaptersHTML;
      console.log('✅ Chapters updated');
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ Teacher dashboard initialized successfully');
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ Error initializing teacher dashboard');
    console.error('═══════════════════════════════════════');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════');
    
    // IMPORTANT: Show helpful error message
    const errorEl = document.getElementById('teacher-student-list');
    if (errorEl) {
      let helpText = 'Check browser console (F12) for details.<br>';
      
      if (error.code === 'permission-denied') {
        helpText += '<strong>⚠️ Firestore Permission Error</strong><br>';
        helpText += 'Your Firestore security rules don\'t allow reading the users collection.<br>';
        helpText += 'Go to Firebase Console → Firestore → Rules and use the SETUP guide.';
      }
      
      errorEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--red);font-size:0.88rem;">
        <strong>Error loading dashboard:</strong><br/>
        ${error.message}<br/>
        <small style="color:var(--muted);">${helpText}</small>
      </div>`;
    }
  }
}

// Update student progress
async function updateStudentProgress(chapter, sectionIndex, isFinalStep = false) {
  if (!currentUser) return;

  try {
    const progressKey = chapter.toLowerCase();
    const progressRef = db.collection('student_progress').doc(currentUser.uid);
    
    // 1. Logic Switch: If it's the final step, skip math and go straight to 100
    let calculatedProgress = isFinalStep ? 100 : Math.min(100, (sectionIndex + 1) * 25);

    // 2. Build the update
    const updateData = {
      [progressKey]: calculatedProgress,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUser.uid
    };

    // 3. Add to the teacher's list if completed
    if (calculatedProgress === 100) {
      updateData.completedModules = firebase.firestore.FieldValue.arrayUnion(chapter);
    }

    // 4. Save (set with merge: true is safest)
    await progressRef.set(updateData, { merge: true });
    
    console.log(`✓ Updated ${chapter} to ${calculatedProgress}% (Final Step: ${isFinalStep})`);
    await loadStudentProgress();
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

// Load student progress from Firestore
async function loadStudentProgress() {
  if (!currentUser) {
    console.warn('No current user');
    return;
  }

  try {
    const progressSnap = await db.collection('student_progress').doc(currentUser.uid).get();
    
    if (progressSnap.exists) {
      const progressData = progressSnap.data();
      console.log('✓ Progress loaded from Firestore:', progressData);
      
      // Update the progress object in index.html if it exists
      if (typeof progress !== 'undefined') {
        // Clear existing completed to avoid duplicates
        progress.completed.clear();
        progress.inProgress.clear();
        
        // Mark completed/in-progress modules based on percentage
        FIREBASE_MODULE_KEYS.forEach(key => {
          const pct = progressData[key];
          if (pct === 100) {
            progress.completed.add(key);
            console.log(`✓ ${key} marked as complete`);
          } else if (pct > 0) {
            progress.inProgress.add(key);
          }
        });
        
        // Update dashboard stats
        if (typeof updateDashboardStats === 'function') {
          updateDashboardStats();
          console.log('✓ Dashboard stats updated');
        }
        
        // Update progress bars with actual percentages
        if (typeof updateAllProgressBars === 'function') {
          updateAllProgressBars(progressData);
          console.log('✓ Progress bars updated');
        }
      } else {
        console.warn('⚠️ Progress object not found in window scope');
      }
    } else {
      console.log('No progress document found yet for user:', currentUser.uid);
    }
  } catch (error) {
    console.error('❌ Error loading progress from Firestore:', error);
  }
}

// Update progress bar UI from database
function updateModuleCardUIfromDB(progressData) {
  if (!progressData) return;

  FIREBASE_MODULE_KEYS.forEach(key => {
    if (progressData[key] === 100) {
      document.querySelectorAll(`[data-module-key="${key}"]`).forEach(el => {
        const fillEl = el.querySelector('.mini-fill');
        if (fillEl) {
          fillEl.style.width = '100%';
          fillEl.style.background = 'var(--green)';
        }
      });
      const dot = document.querySelector(`[data-module-key="${key}"] .sidebar-dot`);
      if (dot) dot.style.background = 'var(--green)';
    }
  });
}

// Update all progress bars with percentages
function updateAllProgressBars(progressData) {
  console.log('updateAllProgressBars called with:', progressData);
  if (!progressData) return;

  FIREBASE_MODULE_KEYS.forEach(key => {
    const pct = progressData[key];
    if (pct === undefined) return;
    document.querySelectorAll(`[data-module-key="${key}"] .mini-fill`).forEach(el => {
      el.style.width = pct + '%';
      el.style.background = pct === 100 ? 'var(--green)' : (pct > 0 ? 'var(--royal)' : '');
    });
  });
}

// Make functions globally accessible
window.handleLogin = handleLogin;
window.logout = logout;
window.setRole = setRole;
window.updateStudentProgress = updateStudentProgress;
window.loadStudentProgress = loadStudentProgress;
window.updateModuleCardUIfromDB = updateModuleCardUIfromDB;
window.updateAllProgressBars = updateAllProgressBars;
window.initTeacherDashboard = initTeacherDashboard;
window.initStudentDashboard = initStudentDashboard;

// Set up event listeners when DOM is ready
function setupEventListeners() {
  // Initialize Firebase
  initFirebase();
  
  // Role selector buttons
  const roleStudentBtn = document.getElementById('role-student');
  const roleTeacherBtn = document.getElementById('role-teacher');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const passwordInput = document.getElementById('password');

  if (roleStudentBtn) roleStudentBtn.addEventListener('click', () => setRole('student'));
  if (roleTeacherBtn) roleTeacherBtn.addEventListener('click', () => setRole('teacher'));
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  
  // Allow Enter key in password field to submit login
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
  
  console.log('Event listeners set up');
}

// Set default role to student
if (!sessionStorage.getItem('selectedRole')) {
  sessionStorage.setItem('selectedRole', 'student');
}

window.addEventListener('load', () => {
    console.log("Window fully loaded. Initializing systems...");
    
    // ONLY call setupEventListeners here. 
    // Let your setupEventListeners function handle calling initFirebase internally!
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }
});