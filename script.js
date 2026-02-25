import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, query, orderByChild, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCQxz47mev45XXLz3ejJViVQCzFL_Fo3z8",
    authDomain: "ursaipa.firebaseapp.com",
    databaseURL: "https://ursaipa-default-rtdb.firebaseio.com",
    projectId: "ursaipa",
    storageBucket: "ursaipa.firebasestorage.app",
    messagingSenderId: "697377996977",
    appId: "1:697377996977:web:f94ca78dfe3d3472942290",
    measurementId: "G-RWFQ47DLHS"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function extractAppId(url) {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
}

async function fetchAppData(appId) {
    try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${appId}`);
        const data = await response.json();
        if (data.resultCount > 0) {
            return {
                name: data.results[0].trackCensoredName,
                icon: data.results[0].artworkUrl100
            };
        }
    } catch (e) { console.error("Fetch error:", e); }
    return { name: "Unknown App", icon: "https://placehold.jp/40x40.png" };
}

window.addGame = async function() {
    const urlInput = document.getElementById('appUrl');
    const submitBtn = document.getElementById('submitBtn');
    let url = urlInput.value.trim();

    if (url === "") {
        alert("Please paste an AppStore link!");
        return;
    }

    const appId = extractAppId(url);
    if (!appId) {
        alert("⚠️ Invalid AppStore URL!");
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Validating...';
    submitBtn.disabled = true;

    try {
        // 🔥 НОВАЯ ЛОГИКА: Обращаемся напрямую к узлу с этим ID
        const gameRef = ref(db, 'games/' + appId);
        const snapshot = await get(gameRef);

        if (snapshot.exists()) {
            alert("⚠️ This game is already in the queue!");
            return;
        }

        submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Registering...';
        const appData = await fetchAppData(appId);

        // Используем set() вместо push(), чтобы appId был ключом
        await set(gameRef, {
            url: url,
            appId: appId,
            appName: appData.name,   
            appIcon: appData.icon,   
            status: "Pending",
            timestamp: Date.now()
        });

        urlInput.value = "";
        alert("✅ Successfully registered!");

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

// Рендер (остается почти таким же)
const gamesDisplayRef = query(ref(db, 'games'), orderByChild('timestamp'));
onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = "";
    if (snapshot.exists()) {
        const games = [];
        snapshot.forEach((child) => { games.push(child.val()); });
        games.reverse().forEach((game) => {
            let statusClass = "st-pending";
            let displayStatus = "PENDING";
            if (game.status === "Processing" || game.status === "В работе") {
                statusClass = "st-processing"; displayStatus = "WORKING";
            } else if (game.status === "Ready" || game.status === "Готово") {
                statusClass = "st-ready"; displayStatus = "READY";
            }
            const time = new Date(game.timestamp).toLocaleDateString();
            const card = `
                <div class="game-card">
                    <img src="${game.appIcon}" class="game-icon">
                    <div class="game-info">
                        <a href="${game.url}" target="_blank" class="game-name">${game.appName}</a>
                        <div class="game-meta"><ion-icon name="calendar-outline"></ion-icon> ${time}</div>
                    </div>
                    <div class="status-badge ${statusClass}">${displayStatus}</div>
                </div>`;
            gamesList.insertAdjacentHTML('beforeend', card);
        });
    } else {
        gamesList.innerHTML = '<div class="loading-state"><span>No requests yet...</span></div>';
    }
});
