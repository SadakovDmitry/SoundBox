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

  CREATE TABLE IF NOT EXISTS franchise_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    format TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL,
    cabin_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, booking_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (cabin_id) REFERENCES cabins(id)
  );

  CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cabin_partners (
    cabin_id INTEGER PRIMARY KEY,
    partner_id INTEGER NOT NULL,
    FOREIGN KEY (cabin_id) REFERENCES cabins(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id)
  );
`);

// Add profile columns if missing
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch { /* column may already exist */ }
try { db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT'); } catch { /* column may already exist */ }
try { db.exec('ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0'); } catch { /* column may already exist */ }
try { db.exec('ALTER TABLE users ADD COLUMN partner_id INTEGER'); } catch { /* column may already exist */ }
try { db.exec('ALTER TABLE bookings ADD COLUMN total_price INTEGER DEFAULT 0'); } catch { /* column may already exist */ }
try { db.exec('ALTER TABLE franchise_leads ADD COLUMN status TEXT DEFAULT "Новая"'); } catch { /* column may already exist */ }
try { db.exec('ALTER TABLE franchise_leads ADD COLUMN manager_note TEXT'); } catch { /* column may already exist */ }

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

// ─── Seed Partners ───────────────────────────────────────────
const partnerCount = db.prepare('SELECT COUNT(*) as count FROM partners').get().count;
if (partnerCount === 0) {
  const insertPartner = db.prepare(`
    INSERT INTO partners (name, city, contact_name, email, phone)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPartner.run('SoundBox Центр', 'Москва', 'Анна Смирнова', 'center@soundbox.test', '+7 900 100-10-10');
  insertPartner.run('SoundBox Campus', 'Москва', 'Илья Орлов', 'campus@soundbox.test', '+7 900 200-20-20');
  insertPartner.run('SoundBox Transit', 'Москва', 'Мария Волкова', 'transit@soundbox.test', '+7 900 300-30-30');
}

const cabinPartnerCount = db.prepare('SELECT COUNT(*) as count FROM cabin_partners').get().count;
if (cabinPartnerCount === 0) {
  const assign = db.prepare('INSERT OR REPLACE INTO cabin_partners (cabin_id, partner_id) VALUES (?, ?)');
  for (let cabinId = 1; cabinId <= 10; cabinId++) {
    const partnerId = cabinId <= 4 ? 1 : cabinId <= 7 ? 2 : 3;
    assign.run(cabinId, partnerId);
  }
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

function getPublicUser(userId) {
  return db.prepare(`
    SELECT id, name, email, phone, avatar_url, balance, partner_id, created_at
    FROM users
    WHERE id = ?
  `).get(userId);
}

function getUserPartnerId(userId) {
  const user = db.prepare('SELECT partner_id FROM users WHERE id = ?').get(userId);
  if (user?.partner_id) return user.partner_id;
  return db.prepare('SELECT id FROM partners ORDER BY id LIMIT 1').get()?.id || null;
}

function getPartner(partnerId) {
  return db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId);
}

function getCabinsForPartner(partnerId) {
  return db.prepare(`
    SELECT c.*, p.id as partner_id, p.name as partner_name,
           COALESCE(bs.booking_count, 0) as booking_count,
           COALESCE(bs.revenue, 0) as revenue,
           COALESCE(bs.hours, 0) as hours,
           COALESCE(rs.review_count, 0) as review_count
    FROM cabins c
    JOIN cabin_partners cp ON cp.cabin_id = c.id
    JOIN partners p ON p.id = cp.partner_id
    LEFT JOIN (
      SELECT cabin_id,
             COUNT(*) as booking_count,
             COALESCE(SUM(CASE WHEN status = 'active' THEN total_price ELSE 0 END), 0) as revenue,
             COALESCE(SUM(CASE WHEN status = 'active' THEN (julianday(end_time) - julianday(start_time)) * 24 ELSE 0 END), 0) as hours
      FROM bookings
      GROUP BY cabin_id
    ) bs ON bs.cabin_id = c.id
    LEFT JOIN (
      SELECT cabin_id, COUNT(*) as review_count
      FROM reviews
      GROUP BY cabin_id
    ) rs ON rs.cabin_id = c.id
    WHERE cp.partner_id = ?
    ORDER BY revenue DESC, c.id ASC
  `).all(partnerId).map((cabin) => ({ ...cabin, ...getCabinStatus(cabin.id) }));
}

function getAllCabinsWithPartners() {
  return db.prepare(`
    SELECT c.*, p.id as partner_id, p.name as partner_name,
           COALESCE(bs.booking_count, 0) as booking_count,
           COALESCE(bs.revenue, 0) as revenue,
           COALESCE(bs.hours, 0) as hours
    FROM cabins c
    LEFT JOIN cabin_partners cp ON cp.cabin_id = c.id
    LEFT JOIN partners p ON p.id = cp.partner_id
    LEFT JOIN (
      SELECT cabin_id,
             COUNT(*) as booking_count,
             COALESCE(SUM(CASE WHEN status = 'active' THEN total_price ELSE 0 END), 0) as revenue,
             COALESCE(SUM(CASE WHEN status = 'active' THEN (julianday(end_time) - julianday(start_time)) * 24 ELSE 0 END), 0) as hours
      FROM bookings
      GROUP BY cabin_id
    ) bs ON bs.cabin_id = c.id
    ORDER BY c.id ASC
  `).all().map((cabin) => ({ ...cabin, ...getCabinStatus(cabin.id) }));
}

function toLocalDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getPeriod(scale = 'month', cursor = new Date()) {
  const base = cursor ? new Date(cursor) : new Date();
  if (Number.isNaN(base.getTime())) return getPeriod(scale, new Date());
  const start = new Date(base);
  const end = new Date(base);
  const buckets = [];
  const pad = (number) => String(number).padStart(2, '0');

  if (scale === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(start.getFullYear() + 1, 0, 1);
    end.setHours(0, 0, 0, 0);
    for (let month = 0; month < 12; month++) {
      const key = `${start.getFullYear()}-${pad(month + 1)}`;
      buckets.push({ key, label: new Date(start.getFullYear(), month, 1).toLocaleDateString('ru-RU', { month: 'short' }) });
    }
    return { scale, start, end, buckets, label: String(start.getFullYear()) };
  }

  if (scale === 'day') {
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 1);
    const dayKey = toDateKey(start);
    for (let hour = 0; hour < 24; hour++) {
      buckets.push({ key: `${dayKey}T${pad(hour)}`, label: `${pad(hour)}:00` });
    }
    return { scale, start, end, buckets, label: start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) };
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setTime(start.getTime());
  end.setMonth(start.getMonth() + 1);
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(day)}`;
    buckets.push({ key, label: String(day) });
  }
  return { scale: 'month', start, end, buckets, label: start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) };
}

function getAnalytics({ scale = 'month', cursor, partnerId, cabinId } = {}) {
  const period = getPeriod(scale, cursor || new Date());
  const bucketExpr = period.scale === 'year'
    ? "substr(b.start_time, 1, 7)"
    : period.scale === 'day'
      ? "substr(b.start_time, 1, 13)"
      : "substr(b.start_time, 1, 10)";
  const filters = ["b.status = 'active'", 'b.start_time >= ?', 'b.start_time < ?'];
  const params = [toLocalDateTime(period.start), toLocalDateTime(period.end)];

  if (partnerId) {
    filters.push('cp.partner_id = ?');
    params.push(partnerId);
  }
  if (cabinId) {
    filters.push('b.cabin_id = ?');
    params.push(cabinId);
  }

  const rows = db.prepare(`
    SELECT ${bucketExpr} as bucket,
           COUNT(b.id) as bookings,
           COALESCE(SUM(b.total_price), 0) as revenue,
           COALESCE(SUM((julianday(b.end_time) - julianday(b.start_time)) * 24), 0) as hours
    FROM bookings b
    JOIN cabins c ON c.id = b.cabin_id
    LEFT JOIN cabin_partners cp ON cp.cabin_id = c.id
    WHERE ${filters.join(' AND ')}
    GROUP BY bucket
    ORDER BY bucket ASC
  `).all(...params);

  const byBucket = new Map(rows.map((row) => [row.bucket, row]));
  const series = period.buckets.map((bucket) => {
    const row = byBucket.get(bucket.key);
    return {
      key: bucket.key,
      label: bucket.label,
      bookings: Number(row?.bookings || 0),
      revenue: Number(row?.revenue || 0),
      hours: Number(row?.hours || 0),
    };
  });

  const totals = series.reduce((acc, item) => ({
    bookings: acc.bookings + item.bookings,
    revenue: acc.revenue + item.revenue,
    hours: acc.hours + item.hours,
  }), { bookings: 0, revenue: 0, hours: 0 });

  return {
    scale: period.scale,
    period_label: period.label,
    start: toLocalDateTime(period.start),
    end: toLocalDateTime(period.end),
    totals,
    series,
  };
}

function getCabinStatus(cabinId) {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const active = db.prepare(`
    SELECT end_time FROM bookings
    WHERE cabin_id = ? AND status = 'active'
    AND start_time <= ? AND end_time > ?
    ORDER BY end_time ASC
    LIMIT 1
  `).get(cabinId, toLocalDateTime(now), toLocalDateTime(now));

  if (active) {
    return { status: 'occupied', status_label: 'Занята', busy_until: active.end_time };
  }

  const upcoming = db.prepare(`
    SELECT start_time FROM bookings
    WHERE cabin_id = ? AND status = 'active'
    AND start_time > ? AND start_time <= ?
    ORDER BY start_time ASC
    LIMIT 1
  `).get(cabinId, toLocalDateTime(now), toLocalDateTime(soon));

  if (upcoming) {
    return { status: 'soon', status_label: 'Скоро бронь', next_booking_at: upcoming.start_time };
  }

  return { status: 'free', status_label: 'Свободна' };
}

function getBookingPrice(cabin, startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutes = Math.round((end - start) / 60000);
  return Math.round((minutes / 60) * cabin.price_per_hour);
}

function refreshCabinRating(cabinId) {
  const avg = db.prepare('SELECT AVG(rating) as rating FROM reviews WHERE cabin_id = ?').get(cabinId).rating;
  if (avg) {
    db.prepare('UPDATE cabins SET rating = ? WHERE id = ?').run(Number(avg).toFixed(1), cabinId);
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
  res.json({ token, user: getPublicUser(result.lastInsertRowid) });
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
  res.json({ token, user: getPublicUser(user.id) });
});

// ─── Profile Routes ──────────────────────────────────────────
app.get('/api/me', authMiddleware, (req, res) => {
  const user = getPublicUser(req.userId);
  res.json(user);
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Имя и email обязательны' });

  // Check if email is taken by another user
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.userId);
  if (existing) return res.status(400).json({ error: 'Email уже занят другим пользователем' });

  db.prepare('UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?').run(name, phone || null, email, req.userId);
  const user = getPublicUser(req.userId);
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

// ─── Wallet Routes ───────────────────────────────────────────
app.get('/api/wallet', authMiddleware, (req, res) => {
  const user = getPublicUser(req.userId);
  const transactions = db.prepare(`
    SELECT id, amount, type, description, created_at
    FROM wallet_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 20
  `).all(req.userId);

  res.json({ balance: user.balance || 0, transactions });
});

app.post('/api/wallet/top-up', authMiddleware, (req, res) => {
  const { amount } = req.body || {};
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < 100 || parsedAmount > 50000) {
    return res.status(400).json({ error: 'Введите сумму от 100 до 50 000 ₽' });
  }

  const roundedAmount = Math.round(parsedAmount);
  const topUp = db.transaction(() => {
    db.prepare('UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?').run(roundedAmount, req.userId);
    db.prepare(`
      INSERT INTO wallet_transactions (user_id, amount, type, description)
      VALUES (?, ?, 'top_up', 'Пополнение кошелька')
    `).run(req.userId, roundedAmount);
    return getPublicUser(req.userId);
  });

  res.json({ success: true, user: topUp(), message: 'Баланс пополнен' });
});

// ─── Franchise Leads ─────────────────────────────────────────
app.post('/api/franchise-leads', (req, res) => {
  const { name, phone, email, city, format, message } = req.body || {};

  if (!name?.trim() || !phone?.trim() || !city?.trim() || !format?.trim()) {
    return res.status(400).json({ error: 'Имя, телефон, город и формат обязательны' });
  }

  const result = db.prepare(`
    INSERT INTO franchise_leads (name, phone, email, city, format, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    phone.trim(),
    email?.trim() || null,
    city.trim(),
    format.trim(),
    message?.trim() || null
  );

  res.json({
    success: true,
    leadId: result.lastInsertRowid,
    message: 'Заявка на франшизу принята',
  });
});

// ─── Cabin Routes ────────────────────────────────────────────
app.get('/api/cabins', authMiddleware, (req, res) => {
  const cabins = db.prepare('SELECT * FROM cabins').all().map((cabin) => ({
    ...cabin,
    ...getCabinStatus(cabin.id),
  }));
  res.json(cabins);
});

app.get('/api/cabins/:id', authMiddleware, (req, res) => {
  const cabin = db.prepare('SELECT * FROM cabins WHERE id = ?').get(req.params.id);
  if (!cabin) return res.status(404).json({ error: 'Кабинка не найдена' });
  res.json({ ...cabin, ...getCabinStatus(cabin.id) });
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
function createPaidBookings(userId, cabinId, slots) {
  const cabin = db.prepare('SELECT * FROM cabins WHERE id = ?').get(cabinId);
  if (!cabin) {
    const error = new Error('Кабинка не найдена');
    error.status = 404;
    throw error;
  }

  const normalizedSlots = slots.map((slot) => ({
    start_time: slot.start_time || slot.start,
    end_time: slot.end_time || slot.end,
  }));

  if (!normalizedSlots.length || normalizedSlots.some((slot) => !slot.start_time || !slot.end_time)) {
    const error = new Error('Выберите дату и время');
    error.status = 400;
    throw error;
  }

  const now = Date.now();
  for (const slot of normalizedSlots) {
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const minutes = Math.round((end - start) / 60000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start || end.getTime() <= now) {
      const error = new Error('Выбран некорректный временной слот');
      error.status = 400;
      throw error;
    }
    if (minutes < 15 || minutes % 15 !== 0) {
      const error = new Error('Длительность бронирования должна быть кратна 15 минутам');
      error.status = 400;
      throw error;
    }
  }

  const sortedSlots = [...normalizedSlots].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  for (let i = 1; i < sortedSlots.length; i++) {
    if (new Date(sortedSlots[i - 1].end_time) > new Date(sortedSlots[i].start_time)) {
      const error = new Error('Выбранные интервалы пересекаются между собой');
      error.status = 400;
      throw error;
    }
  }

  const totalPrice = normalizedSlots.reduce(
    (sum, slot) => sum + getBookingPrice(cabin, slot.start_time, slot.end_time),
    0
  );

  return db.transaction(() => {
    for (const slot of normalizedSlots) {
      const overlap = db.prepare(`
        SELECT id FROM bookings
        WHERE cabin_id = ? AND status = 'active'
        AND start_time < ? AND end_time > ?
      `).get(cabinId, slot.end_time, slot.start_time);

      if (overlap) {
        const error = new Error('Один из выбранных слотов уже занят');
        error.status = 409;
        throw error;
      }
    }

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    const balance = user?.balance || 0;
    if (balance < totalPrice) {
      const error = new Error(`Недостаточно средств: нужно ${totalPrice} ₽, на балансе ${balance} ₽`);
      error.status = 402;
      throw error;
    }

    const bookings = normalizedSlots.map((slot) => {
      const price = getBookingPrice(cabin, slot.start_time, slot.end_time);
      const result = db.prepare(`
        INSERT INTO bookings (user_id, cabin_id, start_time, end_time, total_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, cabinId, slot.start_time, slot.end_time, price);

      return db.prepare(`
        SELECT b.*, c.name as cabin_name, c.address as cabin_address
        FROM bookings b JOIN cabins c ON b.cabin_id = c.id
        WHERE b.id = ?
      `).get(result.lastInsertRowid);
    });

    db.prepare('UPDATE users SET balance = COALESCE(balance, 0) - ? WHERE id = ?').run(totalPrice, userId);
    db.prepare(`
      INSERT INTO wallet_transactions (user_id, amount, type, description)
      VALUES (?, ?, 'booking', ?)
    `).run(userId, -totalPrice, `Бронирование ${cabin.name}`);

    return { bookings, totalPrice, user: getPublicUser(userId) };
  })();
}

app.post('/api/bookings', authMiddleware, (req, res) => {
  const { cabin_id, start_time, end_time } = req.body;
  if (!cabin_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const result = createPaidBookings(req.userId, cabin_id, [{ start_time, end_time }]);
    res.json(result.bookings[0]);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Ошибка бронирования' });
  }
});

app.post('/api/bookings/bulk', authMiddleware, (req, res) => {
  const { cabin_id, slots } = req.body || {};
  if (!cabin_id || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'Кабинка и слоты обязательны' });
  }

  try {
    res.json(createPaidBookings(req.userId, cabin_id, slots));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Ошибка бронирования' });
  }
});

app.get('/api/my-bookings', authMiddleware, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, c.name as cabin_name, c.address as cabin_address, c.lat, c.lng,
           r.rating as review_rating, r.comment as review_comment
    FROM bookings b
    JOIN cabins c ON b.cabin_id = c.id
    LEFT JOIN reviews r ON r.booking_id = b.id AND r.user_id = b.user_id
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
  const booking = db.prepare(`
    SELECT b.*, c.name as cabin_name
    FROM bookings b
    JOIN cabins c ON b.cabin_id = c.id
    WHERE b.id = ? AND b.user_id = ?
  `).get(req.params.id, req.userId);
  if (!booking) return res.status(404).json({ error: 'Бронирование не найдено' });
  if (booking.status !== 'active') return res.status(400).json({ error: 'Бронирование уже отменено' });

  const refundAmount = new Date(booking.start_time) > new Date() ? (booking.total_price || 0) : 0;
  const cancelBooking = db.transaction(() => {
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    if (refundAmount > 0) {
      db.prepare('UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?').run(refundAmount, req.userId);
      db.prepare(`
        INSERT INTO wallet_transactions (user_id, amount, type, description)
        VALUES (?, ?, 'refund', ?)
      `).run(req.userId, refundAmount, `Возврат за ${booking.cabin_name}`);
    }
    return getPublicUser(req.userId);
  });

  res.json({ success: true, refunded: refundAmount, user: cancelBooking() });
});

app.post('/api/bookings/:id/review', authMiddleware, (req, res) => {
  const { rating, comment } = req.body || {};
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'Поставьте оценку от 1 до 5' });
  }

  const booking = db.prepare(`
    SELECT * FROM bookings
    WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.userId);
  if (!booking) return res.status(404).json({ error: 'Бронирование не найдено' });
  if (booking.status !== 'active' || new Date(booking.end_time) > new Date()) {
    return res.status(400).json({ error: 'Отзыв можно оставить после завершения бронирования' });
  }

  try {
    db.prepare(`
      INSERT INTO reviews (user_id, booking_id, cabin_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, booking.id, booking.cabin_id, parsedRating, comment?.trim() || null);
    refreshCabinRating(booking.cabin_id);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Отзыв уже оставлен' });
  }
});

app.get('/api/notifications', authMiddleware, (req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000);
  const user = getPublicUser(req.userId);
  const bookings = db.prepare(`
    SELECT b.*, c.name as cabin_name
    FROM bookings b
    JOIN cabins c ON b.cabin_id = c.id
    WHERE b.user_id = ? AND b.status = 'active'
    AND b.end_time > ?
    ORDER BY b.start_time ASC
    LIMIT 8
  `).all(req.userId, toLocalDateTime(now));

  const notifications = [];
  for (const booking of bookings) {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    if (start > now && start <= soon) {
      notifications.push({
        id: `start-${booking.id}`,
        type: 'soon',
        title: 'Бронирование скоро начнётся',
        text: `${booking.cabin_name}: ${start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
      });
    }
    if (start <= now && end > now && end <= soon) {
      notifications.push({
        id: `end-${booking.id}`,
        type: 'ending',
        title: 'Скоро закончится время',
        text: `${booking.cabin_name}: до ${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
      });
    }
  }
  if ((user.balance || 0) < 200) {
    notifications.push({
      id: 'low-balance',
      type: 'wallet',
      title: 'Низкий баланс',
      text: 'Пополните кошелёк перед следующим бронированием',
    });
  }

  res.json(notifications);
});

app.get('/api/partner/summary', authMiddleware, (req, res) => {
  const partnerId = Number(req.query.partner_id) || getUserPartnerId(req.userId);
  const partner = getPartner(partnerId);
  if (!partner) return res.status(404).json({ error: 'Партнёр не найден' });
  const cabins = getCabinsForPartner(partnerId);

  const totals = cabins.reduce((acc, cabin) => ({
    revenue: acc.revenue + Number(cabin.revenue || 0),
    bookings: acc.bookings + Number(cabin.booking_count || 0),
    hours: acc.hours + Number(cabin.hours || 0),
  }), { revenue: 0, bookings: 0, hours: 0 });

  res.json({ partner, totals, cabins });
});

app.get('/api/partner/analytics', authMiddleware, (req, res) => {
  const partnerId = Number(req.query.partner_id) || getUserPartnerId(req.userId);
  if (!getPartner(partnerId)) return res.status(404).json({ error: 'Партнёр не найден' });
  const cabinId = req.query.cabin_id ? Number(req.query.cabin_id) : null;
  if (cabinId) {
    const belongs = db.prepare('SELECT cabin_id FROM cabin_partners WHERE cabin_id = ? AND partner_id = ?').get(cabinId, partnerId);
    if (!belongs) return res.status(403).json({ error: 'Кабинка не принадлежит партнёру' });
  }
  res.json(getAnalytics({ scale: req.query.scale, cursor: req.query.cursor, partnerId, cabinId }));
});

app.get('/api/partner/cabins/:id/reviews', authMiddleware, (req, res) => {
  const partnerId = Number(req.query.partner_id) || getUserPartnerId(req.userId);
  const cabinId = Number(req.params.id);
  const belongs = db.prepare('SELECT cabin_id FROM cabin_partners WHERE cabin_id = ? AND partner_id = ?').get(cabinId, partnerId);
  if (!belongs) return res.status(403).json({ error: 'Кабинка не принадлежит партнёру' });
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, c.name as cabin_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN cabins c ON c.id = r.cabin_id
    WHERE r.cabin_id = ?
    ORDER BY r.created_at DESC
  `).all(cabinId);
  res.json(reviews);
});

app.get('/api/admin/summary', authMiddleware, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const bookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'active'").get().count;
  const revenue = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = 'active'").get().total;
  const leads = db.prepare('SELECT COUNT(*) as count FROM franchise_leads').get().count;
  const partners = db.prepare('SELECT COUNT(*) as count FROM partners').get().count;
  res.json({ users, bookings, revenue, leads, partners });
});

app.get('/api/admin/analytics', authMiddleware, (req, res) => {
  res.json(getAnalytics({
    scale: req.query.scale,
    cursor: req.query.cursor,
    partnerId: req.query.partner_id ? Number(req.query.partner_id) : null,
    cabinId: req.query.cabin_id ? Number(req.query.cabin_id) : null,
  }));
});

app.get('/api/admin/franchise-leads', authMiddleware, (req, res) => {
  const leads = db.prepare('SELECT * FROM franchise_leads ORDER BY created_at DESC, id DESC').all();
  res.json(leads);
});

app.patch('/api/admin/franchise-leads/:id', authMiddleware, (req, res) => {
  const { status, manager_note } = req.body || {};
  db.prepare('UPDATE franchise_leads SET status = COALESCE(?, status), manager_note = COALESCE(?, manager_note) WHERE id = ?')
    .run(status || null, manager_note || null, req.params.id);
  const lead = db.prepare('SELECT * FROM franchise_leads WHERE id = ?').get(req.params.id);
  res.json(lead);
});

app.get('/api/admin/bookings', authMiddleware, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name as user_name, u.email as user_email, c.name as cabin_name
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN cabins c ON c.id = b.cabin_id
    ORDER BY b.created_at DESC, b.id DESC
    LIMIT 80
  `).all();
  res.json(bookings);
});

app.get('/api/admin/users', authMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, phone, balance, created_at
    FROM users
    ORDER BY created_at DESC, id DESC
    LIMIT 80
  `).all();
  res.json(users);
});

app.get('/api/admin/cabins', authMiddleware, (req, res) => {
  res.json(getAllCabinsWithPartners());
});

app.get('/api/admin/partners', authMiddleware, (req, res) => {
  const partners = db.prepare(`
    SELECT p.*,
           COUNT(DISTINCT cp.cabin_id) as cabin_count,
           COALESCE(SUM(bs.booking_count), 0) as booking_count,
           COALESCE(SUM(bs.revenue), 0) as revenue,
           COALESCE(SUM(bs.hours), 0) as hours
    FROM partners p
    LEFT JOIN cabin_partners cp ON cp.partner_id = p.id
    LEFT JOIN (
      SELECT cabin_id,
             COUNT(*) as booking_count,
             COALESCE(SUM(CASE WHEN status = 'active' THEN total_price ELSE 0 END), 0) as revenue,
             COALESCE(SUM(CASE WHEN status = 'active' THEN (julianday(end_time) - julianday(start_time)) * 24 ELSE 0 END), 0) as hours
      FROM bookings
      GROUP BY cabin_id
    ) bs ON bs.cabin_id = cp.cabin_id
    GROUP BY p.id
    ORDER BY revenue DESC, p.id ASC
  `).all();
  res.json(partners);
});

app.get('/api/admin/partners/:id/summary', authMiddleware, (req, res) => {
  const partnerId = Number(req.params.id);
  const partner = getPartner(partnerId);
  if (!partner) return res.status(404).json({ error: 'Партнёр не найден' });
  const cabins = getCabinsForPartner(partnerId);
  const totals = cabins.reduce((acc, cabin) => ({
    revenue: acc.revenue + Number(cabin.revenue || 0),
    bookings: acc.bookings + Number(cabin.booking_count || 0),
    hours: acc.hours + Number(cabin.hours || 0),
  }), { revenue: 0, bookings: 0, hours: 0 });
  res.json({ partner, totals, cabins });
});

app.get('/api/admin/partners/:id/analytics', authMiddleware, (req, res) => {
  const partnerId = Number(req.params.id);
  if (!getPartner(partnerId)) return res.status(404).json({ error: 'Партнёр не найден' });
  res.json(getAnalytics({
    scale: req.query.scale,
    cursor: req.query.cursor,
    partnerId,
    cabinId: req.query.cabin_id ? Number(req.query.cabin_id) : null,
  }));
});

app.get('/api/admin/cabins/:id/reviews', authMiddleware, (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, c.name as cabin_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN cabins c ON c.id = r.cabin_id
    WHERE r.cabin_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.json(reviews);
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
