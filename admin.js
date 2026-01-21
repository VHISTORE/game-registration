import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQxz47mev45XXLz3ejJViVQCzFL_Fo3z8",
  authDomain: "ursaipa.firebaseapp.com",
  databaseURL: "https://ursaipa-default-rtdb.firebaseio.com",
  projectId: "ursaipa",
  storageBucket: "ursaipa.firebasestorage.app",
  messagingSenderId: "697377996977",
  appId: "1:697377996977:web:f94ca78dfe3d3472942290"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 1. Login Function
window.login = () => {
    signInWithPopup(auth, provider).catch(err => alert("Login failed: " + err.message));
};

// 2. Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'block';
        loadAdminData();
    }
});

// 3. Load Data for Admin
function loadAdminData() {
    const gamesRef = ref(db, 'games');
    onValue(gamesRef, (snapshot) => {
        const adminList = document.getElementById('adminList');
        adminList.innerHTML = "";
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const game = data[key];
                
                const row = `
                    <tr>
                        <td class="app-cell">
                            <img src="${game.appIcon || 'https://placehold.jp/40x40.png'}" class="app-icon" alt="icon">
                            <div class="app-info">
                                <a href="${game.url}" target="_blank" class="app-name">${game.appName || 'Unknown App'}</a>
                            </div>
                        </td>
                        <td><b>${game.status}</b></td>
                        <td class="admin-controls">
                            <button class="btn-status btn-work" onclick="updateStatus('${key}', 'Processing')">Process</button>
                            <button class="btn-status btn-ready" onclick="updateStatus('${key}', 'Ready')">Ready</button>
                            <button class="btn-status btn-delete" onclick="deleteGame('${key}')">DEL</button>
                        </td>
                    </tr>
                `;
                adminList.insertAdjacentHTML('afterbegin', row);
            });
        }
    });
}

// 4. Update Status
window.updateStatus = (id, newStatus) => {
    const gameRef = ref(db, `games/${id}`);
    update(gameRef, { status: newStatus })
        .then(() => console.log("Status updated to: " + newStatus))
        .catch(err => alert("Error: No permission! Log in as an admin."));
};

// 5. Delete Request
window.deleteGame = (id) => {
    if(confirm("Are you sure you want to delete this request?")) {
        remove(ref(db, `games/${id}`));
    }
};
