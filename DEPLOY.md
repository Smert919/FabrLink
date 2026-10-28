# Мессенджер (форк Cinny + Telegram-layout)

Веб-клиент Matrix с переделанным под Telegram интерфейсом. Ставится ярлыком на
iPhone/Android как PWA.

## Что изменено относительно Cinny

- убран рейл «серверов» (Discord-layout) — остался один список чатов;
- список чатов на всю высоту, ширина 380px;
- новый элемент списка: круглый аватар, имя, превью последнего сообщения,
  время, счётчик непрочитанных, «печатает…»;
- шапка в стиле Telegram: аватар профиля, заголовок «Чаты», поиск, меню
  (Новый чат / Новая группа / Обзор / Входящие / Настройки);
- личные чаты и группы в одном списке, сортировка по активности;
- на мобильном два экрана: список → чат.

Файлы: `src/app/features/room-nav/ChatListItem.tsx`,
`src/app/pages/client/home/Home.tsx`, `src/app/pages/Router.tsx`,
`src/app/components/page/style.css.ts`.

## Локальный запуск

```powershell
npm install
npm start -- --host 0.0.0.0 --port 5173
```

- ПК: http://localhost:5173
- Телефон в той же Wi-Fi: http://<IP-компьютера>:5173

## Деплой на Cloudflare Pages

1. Репозиторий подключить в Cloudflare Pages (Framework: Vite).
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Node version: см. `.node-version`

## Сервер (homeserver)

Клиент без сервера не работает: нужен Matrix homeserver (Synapse).
Адрес задаётся в `config.json` → `homeserverList`.

## Лицензия

Форк Cinny, AGPL-3.0. Исходники обязаны оставаться открытыми при раздаче
сервиса по сети.
