import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'cabins-secret-key-2024';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Database Setup ──────────────────────────────────────────
const db = new Database(join(__dirname, 'cabins.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cabins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    description TEXT,
    amenities TEXT DEFAULT '[]',
    price_per_hour INTEGER DEFAULT 500,
    rating REAL DEFAULT 4.5,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    cabin_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    unlocked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (cabin_id) REFERENCES cabins(id)
  );
`);

// Add profile columns if missing
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT'); } catch {}

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir);

// ─── Seed Cabins ─────────────────────────────────────────────
const cabinCount = db.prepare('SELECT COUNT(*) as count FROM cabins').get().count;
if (cabinCount === 0) {
  const cabins = [
    { name: 'SoundBox Арбат', address: 'ул. Арбат, 24', lat: 55.7520, lng: 37.5920, description: 'Уютная кабинка в самом сердце старого Арбата', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Стол и стул"]', price: 200, rating: 4.8 },
    { name: 'SoundBox Сити', address: 'Пресненская наб., 12', lat: 55.7496, lng: 37.5377, description: 'Премиум кабинка с видом на Москва-Сити', amenities: '["Wi-Fi","Кондиционер","Монитор","USB зарядка","Кофемашина"]', price: 200, rating: 4.9 },
    { name: 'SoundBox Парк', address: 'ул. Крымский вал, 9', lat: 55.7312, lng: 37.5958, description: 'Тихая кабинка рядом с Парком Горького', amenities: '["Wi-Fi","Кондиционер","USB зарядка"]', price: 200, rating: 4.6 },
    { name: 'SoundBox Китай-город', address: 'ул. Маросейка, 15', lat: 55.7575, lng: 37.6369, description: 'Кабинка в историческом центре', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Стол и стул"]', price: 200, rating: 4.7 },
    { name: 'SoundBox Белорусская', address: 'ул. Лесная, 5', lat: 55.7764, lng: 37.5933, description: 'Удобная кабинка у метро Белорусская', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Принтер"]', price: 200, rating: 4.5 },
    { name: 'SoundBox Таганка', address: 'ул. Земляной вал, 33', lat: 55.7419, lng: 37.6536, description: 'Просторная кабинка на Таганке', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Стол и стул","Вешалка"]', price: 200, rating: 4.4 },
    { name: 'SoundBox Полянка', address: 'ул. Большая Полянка, 30', lat: 55.7359, lng: 37.6199, description: 'Кабинка в тихом районе Полянки', amenities: '["Wi-Fi","Кондиционер","USB зарядка"]', price: 200, rating: 4.3 },
    { name: 'SoundBox Павелецкая', address: 'ул. Зацепа, 21', lat: 55.7298, lng: 37.6383, description: 'Кабинка рядом с Павелецким вокзалом', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Стол и стул"]', price: 200, rating: 4.6 },
    { name: 'SoundBox Менделеевская', address: 'ул. Новослободская, 16', lat: 55.7816, lng: 37.6032, description: 'Современная кабинка у метро', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Монитор"]', price: 200, rating: 4.7 },
    { name: 'SoundBox ВДНХ', address: 'пр-т Мира, 119', lat: 55.8197, lng: 37.6399, description: 'Кабинка рядом с ВДНХ', amenities: '["Wi-Fi","Кондиционер","USB зарядка","Стол и стул","Кофемашина"]', price: 200, rating: 4.8 },
  ];

  const insert = db.prepare(`
    INSERT INTO cabins (name, address, lat, lng, description, amenities, price_per_hour, rating)
    VALUES (@name, @address, @lat, @lng, @description, @amenities, @price, @rating)
  `);

  for (const cabin of cabins) {
    insert.run(cabin);
  }
  console.log('✅ Seeded 10 cabins in Moscow');
}

// ─── Auth Middleware ─────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userName = decoded.name;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

// ─── Auth Routes ─────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);

  const token = jwt.sign({ id: result.lastInsertRowid, name, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: result.lastInsertRowid, name, email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// ─── Profile Routes ──────────────────────────────────────────
app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Имя и email обязательны' });

  // Check if email is taken by another user
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.userId);
  if (existing) return res.status(400).json({ error: 'Email уже занят другим пользователем' });

  db.prepare('UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?').run(name, phone || null, email, req.userId);
  const user = db.prepare('SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

app.post('/api/profile/avatar', authMiddleware, (req, res) => {
  const { avatar } = req.body; // base64 string
  if (!avatar) return res.status(400).json({ error: 'Файл не предоставлен' });

  const matches = avatar.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Неверный формат изображения' });

  const ext = matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const filename = `avatar_${req.userId}_${Date.now()}.${ext}`;
  writeFileSync(join(uploadsDir, filename), data);

  const avatarUrl = `/api/uploads/${filename}`;
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.userId);
  res.json({ avatar_url: avatarUrl });
});

app.use('/api/uploads', express.static(uploadsDir));

// ─── Cabin Routes ────────────────────────────────────────────
app.get('/api/cabins', authMiddleware, (req, res) => {
  const cabins = db.prepare('SELECT * FROM cabins').all();
  res.json(cabins);
});

app.get('/api/cabins/:id', authMiddleware, (req, res) => {
  const cabin = db.prepare('SELECT * FROM cabins WHERE id = ?').get(req.params.id);
  if (!cabin) return res.status(404).json({ error: 'Кабинка не найдена' });
  res.json(cabin);
});

app.get('/api/cabins/:id/bookings', authMiddleware, (req, res) => {
  const { date } = req.query;
  let bookings;
  if (date) {
    bookings = db.prepare(`
      SELECT b.*, u.name as user_name FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.cabin_id = ? AND DATE(b.start_time) = ? AND b.status = 'active'
      ORDER BY b.start_time
    `).all(req.params.id, date);
  } else {
    bookings = db.prepare(`
      SELECT b.*, u.name as user_name FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.cabin_id = ? AND b.status = 'active' AND b.end_time > datetime('now')
      ORDER BY b.start_time
    `).all(req.params.id);
  }
  res.json(bookings);
});

// ─── Booking Routes ──────────────────────────────────────────
app.post('/api/bookings', authMiddleware, (req, res) => {
  const { cabin_id, start_time, end_time } = req.body;
  if (!cabin_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  // Check overlap
  const overlap = db.prepare(`
    SELECT id FROM bookings
    WHERE cabin_id = ? AND status = 'active'
    AND start_time < ? AND end_time > ?
  `).get(cabin_id, end_time, start_time);

  if (overlap) {
    return res.status(409).json({ error: 'Это время уже занято' });
  }

  const result = db.prepare(`
    INSERT INTO bookings (user_id, cabin_id, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `).run(req.userId, cabin_id, start_time, end_time);

  const booking = db.prepare(`
    SELECT b.*, c.name as cabin_name, c.address as cabin_address
    FROM bookings b JOIN cabins c ON b.cabin_id = c.id
    WHERE b.id = ?
  `).get(result.lastInsertRowid);

  res.json(booking);
});

app.get('/api/my-bookings', authMiddleware, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, c.name as cabin_name, c.address as cabin_address, c.lat, c.lng
    FROM bookings b
    JOIN cabins c ON b.cabin_id = c.id
    WHERE b.user_id = ?
    ORDER BY b.start_time DESC
  `).all(req.userId);
  res.json(bookings);
});

app.post('/api/bookings/:id/unlock', authMiddleware, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!booking) return res.status(404).json({ error: 'Бронирование не найдено' });

  const now = new Date();
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  if (now < start || now > end) {
    return res.status(403).json({ error: 'Кабинку можно открыть только во время бронирования' });
  }

  db.prepare('UPDATE bookings SET unlocked = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Кабинка открыта!' });
});

app.post('/api/bookings/:id/lock', authMiddleware, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!booking) return res.status(404).json({ error: 'Бронирование не найдено' });

  db.prepare('UPDATE bookings SET unlocked = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Кабинка закрыта!' });
});

app.post('/api/bookings/:id/cancel', authMiddleware, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!booking) return res.status(404).json({ error: 'Бронирование не найдено' });

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});


// ─── Serve Frontend (Production) ─────────────────────────────
app.use(express.static(join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
