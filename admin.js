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

// 1. Функция входа
window.login = () => {
    signInWithPopup(auth, provider).catch(err => alert("Ошибка входа: " + err.message));
};

// 2. Проверка авторизации
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'block';
        loadAdminData();
    }
});

// 3. Загрузка данных для админа
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
                        <td><a href="${game.url}" target="_blank">${game.url}</a></td>
                        <td><b>${game.status}</b></td>
                        <td class="admin-controls">
                            <button class="btn-status btn-work" onclick="updateStatus('${key}', 'В работе')">В работу</button>
                            <button class="btn-status btn-ready" onclick="updateStatus('${key}', 'Готово')">Готово</button>
                            <button class="btn-status btn-delete" onclick="deleteGame('${key}')">❌</button>
                        </td>
                    </tr>
                `;
                adminList.insertAdjacentHTML('afterbegin', row);
            });
        }
    });
}

// 4. Смена статуса
window.updateStatus = (id, newStatus) => {
    const gameRef = ref(db, `games/${id}`);
    update(gameRef, { status: newStatus })
        .then(() => console.log("Статус обновлен"))
        .catch(err => alert("Нет прав! Войдите под почтой админа."));
};

// 5. Удаление
window.deleteGame = (id) => {
    if(confirm("Удалить заявку?")) {
        remove(ref(db, `games/${id}`));
    }
};
