// Import necessary Firebase functions from the Modular SDK via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your URSA IPA project configuration
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

// Initialize Firebase App and Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * Function to add a new game.
 * Attached to the global window object to work with the HTML onclick attribute.
 */
window.addGame = function() {
    const urlInput = document.getElementById('appUrl');
    const url = urlInput.value.trim();

    // Simple input validation
    if (url === "") {
        alert("Please paste a link!");
        return;
    }

    // Reference to the 'games' node in Realtime Database
    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    
    // Save data to the database
    set(newGameRef, {
        url: url,
        status: "Pending", // Default status upon registration
        timestamp: Date.now() // Timestamp used for sorting
    }).then(() => {
        urlInput.value = ""; // Clear input field on success
        console.log("Request sent successfully!");
    }).catch((error) => {
        alert("Access denied! Check your Security Rules in the Firebase console.");
        console.error(error);
    });
};

/**
 * Subscribe to real-time database updates.
 * Sorts requests by the time they were added.
 */
const gamesDisplayRef = query(ref(db, 'games'), orderByChild('timestamp'));

onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = ""; // Clear the table before rendering updated data

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const game = childSnapshot.val();
            
            // Logic to select the CSS class and display text based on current status
            let statusClass = "status-default";
            let displayStatus = game.status;

            // Handle English status names for consistency
            if (game.status === "В работе" || game.status === "Processing") {
                statusClass = "status-working";
                displayStatus = "Processing";
            } else if (game.status === "Готово" || game.status === "Ready") {
                statusClass = "status-ready";
                displayStatus = "Ready";
            } else {
                displayStatus = "Pending";
            }

            const row = `
                <tr>
                    <td><a href="${game.url}" target="_blank">${game.url}</a></td>
                    <td><b class="${statusClass}">${displayStatus}</b></td>
                </tr>
            `;
            
            // Insert the new row at the beginning of the table
            gamesList.insertAdjacentHTML('afterbegin', row);
        });
    } else {
        gamesList.innerHTML = "<tr><td colspan='2' style='text-align:center;'>No requests found...</td></tr>";
    }
}, (error) => {
    console.error("Error retrieving data: ", error);
});
