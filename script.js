// Импортируем нужные функции из Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Твой конфиг
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

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Делаем функцию доступной для кнопки в HTML
window.addGame = function() {
    const urlInput = document.getElementById('appUrl');
    const url = urlInput.value.trim();

    if (url === "") {
        alert("Бро, вставь ссылку!");
        return;
    }

    // Сохраняем в базу (узел 'games')
    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    
    set(newGameRef, {
        url: url,
        status: "Проверяется", // Начальный статус
        timestamp: Date.now()
    }).then(() => {
        urlInput.value = ""; // Очищаем поле
        console.log("Данные успешно отправлены!");
    }).catch((error) => {
        alert("Ошибка! Проверь Rules в Firebase");
        console.error(error);
    });
};

// Слушаем изменения в базе в реальном времени
const gamesDisplayRef = ref(db, 'games');
onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = ""; // Чистим таблицу перед обновлением

    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Перебираем объекты и выводим в таблицу
        Object.keys(data).forEach((key) => {
            const game = data[key];
            
            // Определяем цвет текста в зависимости от статуса (для CSS)
            let statusClass = "status-default";
            if (game.status === "В работе") statusClass = "status-working";
            if (game.status === "Готово") statusClass = "status-ready";

            const row = `
                <tr>
                    <td><a href="${game.url}" target="_blank" style="color: #fff;">${game.url}</a></td>
                    <td><b class="${statusClass}">${game.status}</b></td>
                </tr>
            `;
            gamesList.insertAdjacentHTML('afterbegin', row); // Новые сверху
        });
    } else {
        gamesList.innerHTML = "<tr><td colspan='2'>Список пока пуст...</td></tr>";
    }
});
