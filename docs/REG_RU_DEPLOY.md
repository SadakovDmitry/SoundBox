# Деплой SoundBox на REG.ru

SoundBox — full-stack приложение: React/Vite фронтенд собирается в `dist`, а `server.js` запускает Express API, SQLite и отдаёт готовый сайт. Для полного MVP нужен VPS/облачный сервер REG.ru с Node.js. На обычном виртуальном хостинге без Node.js можно разместить только статический лендинг без бронирования, кошелька, админки и API.

## 1. Подготовить сервер

Подключитесь по SSH к VPS:

```bash
ssh root@SERVER_IP
```

Установите Node.js 20+, Git, Nginx и PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs git nginx build-essential
sudo npm install -g pm2
```

## 2. Загрузить проект

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/SadakovDmitry/SoundBox.git soundbox
cd soundbox
```

## 3. Настроить переменные

Скопируйте пример:

```bash
cp .env.example .env
```

Откройте `.env` и замените `JWT_SECRET` на длинную случайную строку:

```bash
nano .env
```

Создайте папку для базы и загрузок:

```bash
mkdir -p /var/www/soundbox/data/uploads
```

## 4. Собрать проект

```bash
npm install
npm run build
```

## 5. Запустить через PM2

В `ecosystem.config.cjs` замените `JWT_SECRET` на тот же секрет, что в `.env`, затем:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Проверка:

```bash
curl http://localhost:3001/api/health
```

## 6. Настроить Nginx

Создайте конфиг:

```bash
sudo nano /etc/nginx/sites-available/soundbox
```

Вставьте, заменив `example.ru` на ваш домен:

```nginx
server {
    listen 80;
    server_name example.ru www.example.ru;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Включите сайт:

```bash
sudo ln -s /etc/nginx/sites-available/soundbox /etc/nginx/sites-enabled/soundbox
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Привязать домен в REG.ru

В панели REG.ru откройте DNS домена и добавьте:

```text
A     @      SERVER_IP
A     www    SERVER_IP
```

DNS может обновляться от нескольких минут до нескольких часов.

## 8. Подключить HTTPS

После того как домен начал открываться с сервера:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.ru -d www.example.ru
```

## 9. Обновление сайта

```bash
cd /var/www/soundbox
git pull
npm install
npm run build
pm2 restart soundbox
```

## Если у вас обычный shared-хостинг REG.ru

Если тариф не даёт SSH/Node.js/PM2, полный SoundBox там не запустится. Варианты:

- перейти на VPS/облачный сервер REG.ru;
- разместить только статический лендинг из папки `dist`, но приложение бронирования и API работать не будут;
- держать backend на VPS/Render, а домен REG.ru направить на него.
