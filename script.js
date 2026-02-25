import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Helper function to fetch name and icon from iTunes API
async function fetchAppData(appUrl) {
    try {
        const appIdMatch = appUrl.match(/id(\d+)/); 
        if (!appIdMatch) return { name: "Unknown App", icon: "https://placehold.jp/40x40.png" };

        const appId = appIdMatch[1];
        const response = await fetch(`https://itunes.apple.com/lookup?id=${appId}`);
        const data = await response.json();

        if (data.resultCount > 0) {
            return {
                name: data.results[0].trackCensoredName,
                icon: data.results[0].artworkUrl100
            };
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
    return { name: "Unknown App", icon: "https://placehold.jp/40x40.png" };
}

window.addGame = async function() {
    const urlInput = document.getElementById('appUrl');
    const submitBtn = document.getElementById('submitBtn');
    const url = urlInput.value.trim();

    if (url === "") {
        alert("Please paste an AppStore link!");
        return;
    }

    // UI Feedback
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Processing...';
    submitBtn.disabled = true;

    try {
        const appData = await fetchAppData(url);

        const gamesRef = ref(db, 'games');
        const newGameRef = push(gamesRef);
        
        await set(newGameRef, {
            url: url,
            appName: appData.name,   
            appIcon: appData.icon,   
            status: "Pending",
            timestamp: Date.now()
        });

        urlInput.value = "";
    } catch (error) {
        alert("Error sending request: " + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

const gamesDisplayRef = query(ref(db, 'games'), orderByChild('timestamp'));

onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = "";

    if (snapshot.exists()) {
        const games = [];
        snapshot.forEach((child) => {
            games.push(child.val());
        });

        // Reverse to show newest first
        games.reverse().forEach((game) => {
            
            // Status Logic
            let statusClass = "st-pending";
            let displayStatus = "PENDING";
            let statusIcon = "time-outline";

            if (game.status === "Processing" || game.status === "В работе") {
                statusClass = "st-processing";
                displayStatus = "WORKING";
                statusIcon = "sync-outline";
            } else if (game.status === "Ready" || game.status === "Готово") {
                statusClass = "st-ready";
                displayStatus = "READY";
                statusIcon = "checkmark-circle-outline";
            }

            const time = new Date(game.timestamp).toLocaleDateString();

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <img src="${game.appIcon || 'https://placehold.jp/40x40.png'}" class="game-icon" alt="icon">
                <div class="game-info">
                    <a href="${game.url}" target="_blank" class="game-name">${game.appName || 'Unknown App'}</a>
                    <div class="game-meta">
                        <ion-icon name="calendar-outline"></ion-icon> ${time}
                    </div>
                </div>
                <div class="status-badge ${statusClass}">
                    ${displayStatus}
                </div>
            `;
            gamesList.appendChild(card);
        });
    } else {
        gamesList.innerHTML = `
            <div class="loading-state">
                <ion-icon name="file-tray-outline" style="font-size: 40px; opacity: 0.3;"></ion-icon>
                <span>No requests yet...</span>
            </div>
        `;
    }
});
