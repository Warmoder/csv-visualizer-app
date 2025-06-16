# CSV Visualizer - Веб-додаток для візуалізації даних

![CSV Visualizer Demo](https://imgchest.com/p/a8465l85vyx)

Простий та інтуїтивно зрозумілий інструмент, що дозволяє користувачам швидко перетворювати дані з CSV-файлів на інтерактивні графіки прямо в браузері.

**[➡️ Подивитись живу версію (Live Demo)](https://csv-visualizer-app2.vercel.app/)**

---

## 🚀 Основні можливості

*   **Просте завантаження:** Завантажуйте CSV-файли простим перетягуванням або через діалогове вікно.
*   **Динамічний вибір даних:** Обирайте стовпці для осі X та Y прямо з інтерфейсу.
*   **Різноманітні типи графіків:** Візуалізуйте дані у вигляді стовпчикових, лінійних або кругових діаграм.
*   **Швидкість та зручність:** Отримуйте візуалізацію миттєво, без реєстрації та встановлення програм.
*   **Адаптивний дизайн:** Користуйтеся додатком як на настільних комп'ютерах, так і на мобільних пристроях.

## ⚙️ Технологічний стек

Цей проект побудовано з використанням наступних технологій та інструментів:

*   **Фронтенд:**
    *   [React.js](https://react.dev/) - для побудови динамічного користувацького інтерфейсу.
        *   *Використовувався з [Create React App](https://create-react-app.dev/) для початкового налаштування.*
    *   [Chart.js](https://www.chartjs.org/) - для створення графіків.
        *   *Використовувався через обгортку [react-chartjs-2](https://react-chartjs-2.js.org/).*
    *   [Axios](https://axios-http.com/) - для взаємодії з backend API (HTTP-запити).
    *   HTML - для структури веб-сторінок.
    *   CSS - для стилізації інтерфейсу.
    *   JavaScript (ES6+) - основна мова програмування фронтенду.

*   **Бекенд:**
    *   [Python](https://www.python.org/) - як основна мова програмування.
    *   [Flask](https://flask.palletsprojects.com/) - легкий веб-фреймворк для створення API.
    *   [Pandas](https://pandas.pydata.org/) - для ефективної обробки та аналізу CSV-даних.
    *   [Flask-CORS](https://flask-cors.readthedocs.io/) - розширення Flask для обробки Cross-Origin Resource Sharing.
    *   [Gunicorn](https://gunicorn.org/) - WSGI HTTP сервер для запуску Flask в продакшені.

*   **Деплоймент:**
    *   **Фронтенд:** [Vercel](https://vercel.com/)
    *   **Бекенд:** [Render](https://render.com/)

*   **Інструменти розробки та управління кодом:**
    *   [Git](https://git-scm.com/) - система контролю версій.
    *   [GitHub](https://github.com/) - хостинг для Git-репозиторіїв.
    *   [Node.js](https://nodejs.org/) - середовище виконання JavaScript (необхідне для React, npm/yarn).
    *   [npm](https://www.npmjs.com/) (або [Yarn](https://yarnpkg.com/)) - менеджер пакетів для Node.js.
    *   Віртуальне середовище Python ([venv](https://docs.python.org/3/library/venv.html)) - для ізоляції залежностей Python.
    *   VS Code (Visual Studio Code) (ймовірно) - текстовий редактор/IDE.
    *   Термінал (PowerShell) - для виконання команд.

*   **Формати даних та протоколи:**
    *   JSON (JavaScript Object Notation) - для обміну даними між фронтендом та бекендом.
    *   HTTP/HTTPS - протокол для комунікації клієнт-сервер.

## 📦 Як запустити проект локально

Щоб запустити цей проект на вашому комп'ютері, виконайте наступні кроки.

### Передумови

*   Встановлений [Node.js](https://nodejs.org/) (версія 16 або вище)
*   Встановлений [Python](https://www.python.org/) (версія 3.8 або вище)
*   Менеджер пакетів `npm` або `yarn`

### Запуск Бекенду (серверна частина)

1.  **Клонуйте репозиторій:**
    ```bash
    git clone https://github.com/[Ваш-Нікнейм]/[Назва-Репозиторію].git
    cd [Назва-Репозиторію]
    ```

2.  **Перейдіть у папку бекенду:**
    ```bash
    cd backend
    ```

3.  **Створіть та активуйте віртуальне середовище:**
    ```bash
    # Для Windows
    python -m venv venv
    .\venv\Scripts\activate

    # Для macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

4.  **Встановіть залежності:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Запустіть Flask-сервер:**
    ```bash
    flask run
    ```
    Ваш бекенд буде запущено на `http://127.0.0.1:5000`.

### Запуск Фронтенду (клієнтська частина)

1.  **Відкрийте новий термінал.**

2.  **Перейдіть у папку фронтенду:**
    ```bash
    cd [Назва-Репозиторію]/frontend
    ```

3.  **Встановіть залежності:**
    ```bash
    npm install
    ```

4.  **Запустіть React-додаток:**
    ```bash
    npm start
    ```
    Ваш фронтенд буде запущено на `http://localhost:3000` і автоматично відкриється у браузері.

## 🧑‍💻 Команда розробників

Цей проект був створений у рамках [назва практики/курсу] командою чудових розробників:

*   **[Бєглов Антон]** - Team Lead / Project Manager ([@GitHub-Warmoder](https://github.com/Warmoder))
*   **[Гулий Євгеній]** - Backend Developer ([@GitHub-antisociallame](https://github.com/antisociallame))
*   **[Хоменко Назар]** - Frontend Developer (Core Logic) ([@GitHub-N1azar1](https://github.com/N1azar1))
*   **[Котигорох Віталій]** - Frontend Developer (UI/UX) ([@GitHub-qrcxc](https://github.com/qrcxc))
*   **[Ткалич Євген]** - QA & Documentation Specialist ([@GitHub-gtyroumn](https://github.com/gtyroumn))

## 📜 Ліцензія

Цей проект розповсюджується за ліцензією MIT. Детальніше дивіться у файлі [LICENSE](LICENSE).
