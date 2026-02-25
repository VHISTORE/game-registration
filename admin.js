import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// 1. Auth Functions
window.login = () => {
    signInWithPopup(auth, provider).catch(err => alert("Login failed: " + err.message));
};

window.logout = () => {
    signOut(auth).then(() => window.location.reload());
};

// 2. Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'flex'; // Flex для контейнера
        loadAdminData();
    } else {
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('admin-section').style.display = 'none';
    }
});

// 3. Load Data
function loadAdminData() {
    const gamesRef = ref(db, 'games');
    onValue(gamesRef, (snapshot) => {
        const adminList = document.getElementById('adminList');
        adminList.innerHTML = "";
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const games = [];
            
            // Convert object to array
            Object.keys(data).forEach(key => {
                games.push({ id: key, ...data[key] });
            });

            // Sort by timestamp (newest first)
            games.sort((a, b) => b.timestamp - a.timestamp).forEach(game => {
                
                // Status Logic
                let statusBadge = '';
                if (game.status === 'Processing') statusBadge = '<div class="status-badge st-processing">WORKING</div>';
                else if (game.status === 'Ready') statusBadge = '<div class="status-badge st-ready">READY</div>';
                else statusBadge = '<div class="status-badge st-pending">PENDING</div>';

                const card = document.createElement('div');
                card.className = 'game-card';
                card.style.flexDirection = 'column'; // Vertical layout for admin actions
                card.style.alignItems = 'stretch';

                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">
                        <img src="${game.appIcon || 'https://placehold.jp/40x40.png'}" class="game-icon" alt="icon">
                        <div class="game-info">
                            <a href="${game.url}" target="_blank" class="game-name">${game.appName || 'Unknown App'}</a>
                            <div class="game-meta" style="justify-content: space-between;">
                                <span>${new Date(game.timestamp).toLocaleDateString()}</span>
                                ${statusBadge}
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button class="action-btn btn-process" onclick="updateStatus('${game.id}', 'Processing')">
                            <ion-icon name="sync-outline"></ion-icon> Work
                        </button>
                        <button class="action-btn btn-ready" onclick="updateStatus('${game.id}', 'Ready')">
                            <ion-icon name="checkmark-done-outline"></ion-icon> Ready
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteGame('${game.id}')">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                `;
                adminList.appendChild(card);
            });
        } else {
            adminList.innerHTML = '<div class="loading-state"><span>No requests found</span></div>';
        }
    });
}

// 4. Update Status
window.updateStatus = (id, newStatus) => {
    const gameRef = ref(db, `games/${id}`);
    update(gameRef, { status: newStatus })
        .catch(err => alert("Error: No permission! Log in as an admin."));
};

// 5. Delete Request
window.deleteGame = (id) => {
    if(confirm("Delete this request?")) {
        remove(ref(db, `games/${id}`))
            .catch(err => alert("Error: No permission!"));
    }
};
