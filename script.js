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

// Function to get App info from iTunes API
async function fetchAppData(appUrl) {
    try {
        const appIdMatch = appUrl.match(/id(\12\d+)/); // Extracts numbers after 'id'
        if (!appIdMatch) return { name: "Unknown App", icon: "" };

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
        console.error("Meta fetch error", e);
    }
    return { name: "Unknown App", icon: "" };
}

window.addGame = async function() {
    const urlInput = document.getElementById('appUrl');
    const url = urlInput.value.trim();

    if (url === "") {
        alert("Please paste a link!");
        return;
    }

    // Fetch name and icon before saving to Firebase
    const appData = await fetchAppData(url);

    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    
    set(newGameRef, {
        url: url,
        appName: appData.name,   // Saving Name
        appIcon: appData.icon,   // Saving Icon URL
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
            let displayStatus = game.status;

            if (game.status === "Processing") {
                statusClass = "status-working";
            } else if (game.status === "Ready") {
                statusClass = "status-ready";
            }

            // Using stored appIcon and appName, fallback to URL if metadata missing
            const row = `
                <tr>
                    <td class="app-cell">
                        <img src="${game.appIcon || 'https://via.placeholder.com/40'}" class="app-icon" alt="icon">
                        <div class="app-info">
                            <a href="${game.url}" target="_blank" class="app-name">${game.appName || 'Unknown App'}</a>
                        </div>
                    </td>
                    <td><b class="${statusClass}">${displayStatus}</b></td>
                </tr>
            `;
            gamesList.insertAdjacentHTML('afterbegin', row);
        });
    } else {
        gamesList.innerHTML = "<tr><td colspan='2' style='text-align:center;'>No requests found...</td></tr>";
    }
});
