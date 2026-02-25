import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Функция для извлечения ID из ссылки (например, из .../id123456 берём 123456)
function extractAppId(url) {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
}

// Получаем данные из iTunes API
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
    } catch (e) {
        console.error("Fetch error:", e);
    }
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

    // 1. Извлекаем ID
    const appId = extractAppId(url);

    if (!appId) {
        alert("⚠️ Invalid AppStore URL! Could not find App ID.");
        return;
    }

    // UI Feedback
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Checking...';
    submitBtn.disabled = true;

    try {
        // 2. ПРОВЕРКА НА ДУБЛИКАТЫ ПО ID
        // Ищем в базе запись, у которой поле 'appId' равно найденному ID
        const gamesRef = ref(db, 'games');
        const duplicateQuery = query(gamesRef, orderByChild('appId'), equalTo(appId));
        const snapshot = await get(duplicateQuery);

        if (snapshot.exists()) {
            alert("⚠️ This game is already in the queue (ID match)!");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // 3. ЕСЛИ НЕ ДУБЛИКАТ
        submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Fetching Data...';
        
        // Запрашиваем данные по ID, а не по ссылке (надежнее)
        const appData = await fetchAppData(appId);

        const newGameRef = push(gamesRef);
        
        await set(newGameRef, {
            url: url,          // Сохраняем ссылку юзера (для админа)
            appId: appId,      // 🔥 Сохраняем ID для будущих проверок
            appName: appData.name,   
            appIcon: appData.icon,   
            status: "Pending",
            timestamp: Date.now()
        });

        urlInput.value = "";
        console.log("Game registered successfully");

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

// Рендер списка (без изменений)
const gamesDisplayRef = query(ref(db, 'games'), orderByChild('timestamp'));

onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = "";

    if (snapshot.exists()) {
        const games = [];
        snapshot.forEach((child) => {
            games.push(child.val());
        });

        games.reverse().forEach((game) => {
            
            let statusClass = "st-pending";
            let displayStatus = "PENDING";

            if (game.status === "Processing" || game.status === "В работе") {
                statusClass = "st-processing";
                displayStatus = "WORKING";
            } else if (game.status === "Ready" || game.status === "Готово") {
                statusClass = "st-ready";
                displayStatus = "READY";
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
