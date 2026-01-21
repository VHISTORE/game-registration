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

// Функция для получения названия и иконки из iTunes API
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
    const url = urlInput.value.trim();

    if (url === "") {
        alert("Please paste a link!");
        return;
    }

    // Сначала получаем данные приложения
    const appData = await fetchAppData(url);

    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    
    set(newGameRef, {
        url: url,
        appName: appData.name,   
        appIcon: appData.icon,   
        status: "Pending",
        timestamp: Date.now()
    }).then(() => {
        urlInput.value = "";
        console.log("Request sent successfully!");
    }).catch((error) => {
        alert("Access denied!");
        console.error(error);
    });
};

const gamesDisplayRef = query(ref(db, 'games'), orderByChild('timestamp'));

onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = "";

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const game = childSnapshot.val();
            
            let statusClass = "status-default";
            if (game.status === "Processing" || game.status === "В работе") statusClass = "status-working";
            if (game.status === "Ready" || game.status === "Готово") statusClass = "status-ready";

            const row = `
                <tr>
                    <td class="app-cell">
                        <img src="${game.appIcon || 'https://placehold.jp/40x40.png'}" class="app-icon" alt="icon">
                        <div class="app-info">
                            <a href="${game.url}" target="_blank" class="app-name">${game.appName || 'Unknown App'}</a>
                        </div>
                    </td>
                    <td><b class="${statusClass}">${game.status}</b></td>
                </tr>
            `;
            gamesList.insertAdjacentHTML('afterbegin', row);
        });
    } else {
        gamesList.innerHTML = "<tr><td colspan='2' style='text-align:center;'>No requests found...</td></tr>";
    }
});
