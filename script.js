// Импортируем необходимые функции Firebase модульного SDK через CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Конфигурация твоего проекта URSA IPA
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

// Инициализация Firebase приложения и базы данных
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * Функция добавления новой игры.
 * Привязана к глобальному объекту window, чтобы работать через onclick в HTML.
 */
window.addGame = function() {
    const urlInput = document.getElementById('appUrl');
    const url = urlInput.value.trim();

    // Простая валидация ввода
    if (url === "") {
        alert("Бро, вставь ссылку!");
        return;
    }

    // Ссылка на узел 'games' в Realtime Database
    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    
    // Запись данных в базу
    set(newGameRef, {
        url: url,
        status: "Проверяется", // Статус по умолчанию при регистрации
        timestamp: Date.now()   // Время добавления для сортировки
    }).then(() => {
        urlInput.value = ""; // Очистка поля ввода при успехе
        console.log("Заявка успешно отправлена!");
    }).catch((error) => {
        alert("Ошибка доступа! Проверь настройки Rules в консоли Firebase.");
        console.error(error);
    });
};

/**
 * Подписка на обновления базы данных в реальном времени.
 * Сортирует заявки по времени добавления.
 */
const gamesDisplayRef = query(ref(db, 'games'), orderByChild('timestamp'));

onValue(gamesDisplayRef, (snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = ""; // Очистка таблицы перед отрисовкой новых данных

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const game = childSnapshot.val();
            
            // Логика выбора CSS класса в зависимости от текущего статуса
            let statusClass = "status-default";
            if (game.status === "В работе") statusClass = "status-working";
            if (game.status === "Готово") statusClass = "status-ready";

            const row = `
                <tr>
                    <td><a href="${game.url}" target="_blank">${game.url}</a></td>
                    <td><b class="${statusClass}">${game.status}</b></td>
                </tr>
            `;
            
            // Вставляем новую строку в начало таблицы
            gamesList.insertAdjacentHTML('afterbegin', row);
        });
    } else {
        gamesList.innerHTML = "<tr><td colspan='2' style='text-align:center;'>Список заявок пуст...</td></tr>";
    }
}, (error) => {
    console.error("Ошибка при получении данных: ", error);
});
