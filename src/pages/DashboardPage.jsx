import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Avatar, Chip, Skeleton,
  IconButton, Collapse, Divider, Rating, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Map as MapIcon, History, VolumeOff, Lock, LockOpen,
  AccessTime, LocationOn, Logout, Cancel, ArrowForward,
  Wifi, AcUnit, UsbRounded, DesktopMac, Edit, CameraAlt, Phone, Email, Person,
  AccountBalanceWallet, CreditCard, NotificationsActive, AdminPanelSettings,
  BusinessCenter, StarRate,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Merge consecutive bookings for the same cabin ───────────
function mergeConsecutiveBookings(bookings) {
  if (!bookings.length) return [];
  const sorted = [...bookings].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const merged = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const currentEnd = new Date(current.end_time).getTime();
    const nextStart = new Date(next.start_time).getTime();
    // Same cabin and end touches start → merge
    if (next.cabin_id === current.cabin_id && Math.abs(currentEnd - nextStart) < 60000) {
      current.end_time = next.end_time;
      // Keep unlocked if any part is unlocked
      if (next.unlocked) current.unlocked = 1;
      // Store merged IDs for cancellation
      current._mergedIds = [...(current._mergedIds || [current.id]), next.id];
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

// ─── Sort by proximity: active first, then upcoming by closeness ──
function sortByProximity(bookings) {
  const now = new Date();
  return [...bookings].sort((a, b) => {
    const aStart = new Date(a.start_time);
    const aEnd = new Date(a.end_time);
    const bStart = new Date(b.start_time);
    const bEnd = new Date(b.end_time);
    const aIsActive = now >= aStart && now <= aEnd;
    const bIsActive = now >= bStart && now <= bEnd;

    // Active first
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Then by start_time closeness to now
    return Math.abs(aStart - now) - Math.abs(bStart - now);
  });
}

function CountdownTimer({ targetDate, label }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontFamily="monospace" fontWeight={700} sx={{ color: 'secondary.main' }}>
        {timeLeft}
      </Typography>
    </Box>
  );
}

function ActiveBookingCard({ booking, onRefresh }) {
  const [unlocking, setUnlocking] = useState(false);
  const now = new Date();
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const isActive = isWithinInterval(now, { start, end });
  const isUpcoming = isFuture(start);
  const isFinished = isPast(end);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await api.unlockCabin(booking.id);
      toast.success('🔓 Кабинка открыта!', { style: { background: '#1a1a2e', color: '#fff', border: '1px solid #00E676' } });
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleCancel = async () => {
    try {
      // Cancel all merged IDs if they exist
      const ids = booking._mergedIds || [booking.id];
      for (const id of ids) {
        await api.cancelBooking(id);
      }
      toast.success('Бронирование отменено');
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLock = async () => {
    setUnlocking(true);
    try {
      await api.lockCabin(booking.id);
      toast.success('🔒 Кабинка закрыта!', { style: { background: '#1a1a2e', color: '#fff', border: '1px solid #FF5252' } });
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  // Calculate duration in hours
  const durationHours = Math.round((end - start) / 3600000);

  return (
    <Card
      component={motion.div}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      sx={{
        mb: 2, overflow: 'visible',
        border: isActive ? '1px solid rgba(0, 230, 118, 0.4)' : undefined,
        boxShadow: isActive ? '0 0 30px rgba(0, 230, 118, 0.15)' : undefined,
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{booking.cabin_name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <LocationOn sx={{ fontSize: 14 }} />
              <Typography variant="caption">{booking.cabin_address}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {durationHours > 1 && (
              <Chip size="small" label={`${durationHours} ч`} variant="outlined"
                sx={{ fontWeight: 600, borderColor: 'rgba(124,77,255,0.3)', fontSize: '0.7rem' }} />
            )}
            <Chip
              size="small"
              label={isActive ? 'Сейчас' : isUpcoming ? 'Скоро' : 'Завершено'}
              color={isActive ? 'success' : isUpcoming ? 'warning' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              {format(start, 'dd MMM, HH:mm', { locale: ru })} — {format(end, 'HH:mm', { locale: ru })}
            </Typography>
          </Box>
        </Box>

        {/* Timer */}
        {isUpcoming && <CountdownTimer targetDate={booking.start_time} label="До начала" />}
        {isActive && !isFinished && <CountdownTimer targetDate={booking.end_time} label="До окончания" />}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {isActive && !booking.unlocked && (
            <Button
              variant="contained"
              color="success"
              startIcon={<LockOpen />}
              onClick={handleUnlock}
              disabled={unlocking}
              fullWidth
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
                boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)',
                color: '#000', fontWeight: 700,
                animation: 'pulse-glow 2s infinite',
                '@keyframes pulse-glow': {
                  '0%, 100%': { boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)' },
                  '50%': { boxShadow: '0 4px 40px rgba(0, 230, 118, 0.7)' },
                },
              }}
            >
              Открыть кабинку
            </Button>
          )}
          {isActive && booking.unlocked === 1 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Lock />}
              onClick={handleLock}
              disabled={unlocking}
              fullWidth
              sx={{ borderColor: 'error.main' }}
            >
              Закрыть кабинку
            </Button>
          )}
          {isFinished && (
            <Button variant="outlined" startIcon={<Lock />} fullWidth disabled sx={{ opacity: 0.5 }}>
              Заблокировано
            </Button>
          )}
          {isUpcoming && (
            <Button
              variant="outlined" color="error" size="small"
              startIcon={<Cancel />}
              onClick={handleCancel}
              fullWidth
            >
              Отменить
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
  return `${baseUrl}${path}`;
};

// ─── Profile Dialog ──────────────────────────────────────────
function ProfileDialog({ open, onClose, user, onUpdated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [open, user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Максимум 20 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.uploadAvatar(reader.result);
        toast.success('Фото обновлено!');
        onUpdated();
      } catch (err) {
        toast.error(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Имя и email обязательны');
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({ name, email, phone });
      toast.success('Профиль обновлён!');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = getFullUrl(user?.avatar_url);
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Мой профиль</Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
        {/* Avatar */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
          <Avatar
            src={avatarUrl}
            sx={{
              width: 96, height: 96, mx: 'auto',
              background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
              fontSize: '2rem', fontWeight: 700,
            }}
          >
            {!avatarUrl && initials}
          </Avatar>
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            sx={{
              position: 'absolute', bottom: -4, right: -4,
              background: 'linear-gradient(135deg, #7C4DFF, #448AFF)',
              color: '#fff', width: 32, height: 32,
              '&:hover': { background: '#7C4DFF' },
            }}
          >
            <CameraAlt sx={{ fontSize: 16 }} />
          </IconButton>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </Box>

        {/* Fields */}
        <TextField
          fullWidth size="small" label="Имя" value={name}
          onChange={(e) => setName(e.target.value)}
          InputProps={{ startAdornment: <Person sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} /> }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth size="small" label="Телефон" value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (___) ___-__-__"
          InputProps={{ startAdornment: <Phone sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} /> }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth size="small" label="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{ startAdornment: <Email sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} /> }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TopUpDialog({ open, onClose, onUpdated }) {
  const [amount, setAmount] = useState('1000');
  const [card, setCard] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) < 100) {
      toast.error('Минимальная сумма пополнения 100 ₽');
      return;
    }
    if (!card.trim() || !holder.trim() || !expiry.trim() || !cvc.trim()) {
      toast.error('Заполните данные карты');
      return;
    }
    setSaving(true);
    try {
      await api.topUpWallet({ amount: Number(amount), card, holder, expiry, cvc });
      toast.success('Баланс пополнен');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Пополнить кошелёк</Typography>
        <Typography variant="caption" color="text.secondary">Демо-оплата начисляет виртуальные деньги</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField fullWidth size="small" label="Сумма" type="number" value={amount}
          onChange={(e) => setAmount(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth size="small" label="Номер карты" value={card}
          onChange={(e) => setCard(e.target.value)} placeholder="0000 0000 0000 0000" sx={{ mb: 2 }} />
        <TextField fullWidth size="small" label="Имя на карте" value={holder}
          onChange={(e) => setHolder(e.target.value)} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <TextField size="small" label="ММ/ГГ" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          <TextField size="small" label="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Зачисляем...' : 'Пополнить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function WalletCard({ user, wallet, onTopUp }) {
  return (
    <Card component={motion.div} variants={itemVariants} sx={{ mb: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Кошелёк SoundBox</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'secondary.main', mt: 0.5 }}>
              {user?.balance || 0} ₽
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<CreditCard />} onClick={onTopUp}>
            Пополнить
          </Button>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
        {wallet?.transactions?.length ? (
          wallet.transactions.slice(0, 3).map((tx) => (
            <Box key={tx.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
              <Typography variant="body2" color="text.secondary">{tx.description || 'Операция'}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: tx.amount > 0 ? '#00E676' : 'text.primary' }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">Пополните баланс перед первым бронированием.</Typography>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsCard({ notifications }) {
  if (!notifications.length) return null;
  return (
    <Card component={motion.div} variants={itemVariants} sx={{ mb: { xs: 2, sm: 3 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsActive sx={{ fontSize: 20, color: 'secondary.main' }} />
          Уведомления
        </Typography>
        {notifications.slice(0, 4).map((item) => (
          <Alert key={item.id} severity={item.type === 'wallet' ? 'warning' : 'info'} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
            <Typography variant="caption" color="text.secondary">{item.text}</Typography>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewDialog({ booking, open, onClose, onSaved }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(5);
      setComment('');
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.reviewBooking(booking.id, rating, comment);
      toast.success('Спасибо за отзыв!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Оценить бронирование</Typography>
        <Typography variant="caption" color="text.secondary">{booking?.cabin_name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Rating value={rating} onChange={(_, value) => setRating(value || 5)} size="large" sx={{ mb: 2 }} />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Отправить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [wallet, setWallet] = useState({ transactions: [] });
  const [notifications, setNotifications] = useState([]);
  const [reviewBooking, setReviewBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const data = await api.getMyBookings();
      setBookings(data);
    } catch {
      toast.error('Ошибка загрузки бронирований');
    } finally {
      setLoading(false);
    }
  };

  const fetchCabinetData = async () => {
    try {
      const [walletData, notificationsData] = await Promise.all([
        api.getWallet(),
        api.getNotifications(),
      ]);
      setWallet(walletData);
      setNotifications(notificationsData);
    } catch {
      // Dashboard still works if optional widgets fail.
    }
  };

  const refreshCabinet = async () => {
    await Promise.all([
      fetchBookings(),
      fetchCabinetData(),
      refreshUser?.(),
    ]);
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchBookings();
      fetchCabinetData();
    });
    const interval = setInterval(() => {
      fetchBookings();
      fetchCabinetData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const rawActive = bookings.filter((b) => b.status === 'active' && new Date(b.end_time) > now);
  const rawPast = bookings.filter((b) => b.status !== 'active' || new Date(b.end_time) <= now);

  // Merge consecutive and sort by proximity
  const activeBookings = sortByProximity(mergeConsecutiveBookings(rawActive));
  const pastBookings = mergeConsecutiveBookings(rawPast);

  const avatarUrl = getFullUrl(user?.avatar_url);
  const avatarInitials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <Box sx={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 30% 0%, rgba(124,77,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(0,229,255,0.06) 0%, transparent 50%), #0A0E1A',
      px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: { xs: '100%', sm: 540, md: 640, lg: 720 }, mx: 'auto' }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">

        {/* Header */}
        <Box component={motion.div} variants={itemVariants} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2.5, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => setProfileOpen(true)}>
              <Avatar
                src={avatarUrl}
                sx={{
                  width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 },
                  background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
                  fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.1rem' },
                }}
              >
                {!avatarUrl && avatarInitials}
              </Avatar>
              <Box sx={{
                position: 'absolute', bottom: -2, right: -2,
                width: 16, height: 16, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C4DFF, #448AFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #0A0E1A',
              }}>
                <Edit sx={{ fontSize: 8, color: '#fff' }} />
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Привет, {user?.name?.split(' ')[0]}!</Typography>
              <Typography variant="caption" color="text.secondary">Личный кабинет</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip
              icon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
              label={`${user?.balance || 0} ₽`}
              onClick={() => setTopUpOpen(true)}
              sx={{
                borderColor: 'rgba(124,77,255,0.35)',
                color: 'secondary.main',
                fontWeight: 700,
              }}
              variant="outlined"
            />
            <IconButton onClick={() => { logout(); navigate('/'); }} sx={{ color: 'text.secondary' }}>
              <Logout />
            </IconButton>
          </Box>
        </Box>

        <WalletCard user={user} wallet={wallet} onTopUp={() => setTopUpOpen(true)} />
        <NotificationsCard notifications={notifications} />

        {/* Welcome Card */}
        <Card component={motion.div} variants={itemVariants} sx={{ mb: { xs: 2, sm: 3 }, overflow: 'hidden', position: 'relative' }}>
          <Box sx={{
            position: 'absolute', top: -30, right: -30, width: 120, height: 120,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.2), transparent)',
          }} />
          <CardContent sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VolumeOff sx={{ color: 'secondary.main' }} />
              <Typography variant="h6" fontWeight={700}>SoundBox</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Забронируйте звукоизолированную кабинку для работы, звонков или отдыха.
              Выберите удобную кабинку на карте, укажите время — и всё готово!
            </Typography>
            <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1.5 }, flexWrap: 'wrap' }}>
              {[
                { icon: <Wifi sx={{ fontSize: 16 }} />, label: 'Wi-Fi' },
                { icon: <AcUnit sx={{ fontSize: 16 }} />, label: 'Климат' },
                { icon: <UsbRounded sx={{ fontSize: 16 }} />, label: 'Зарядка' },
                { icon: <DesktopMac sx={{ fontSize: 16 }} />, label: 'Монитор' },
              ].map((item) => (
                <Chip key={item.label} icon={item.icon} label={item.label} size="small" variant="outlined"
                  sx={{ borderColor: 'rgba(124,77,255,0.3)', color: 'text.secondary', fontSize: '0.75rem' }} />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card component={motion.div} variants={itemVariants} sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Как это работает?
            </Typography>
            {[
              { step: '1', text: 'Откройте карту и выберите кабинку', color: '#7C4DFF' },
              { step: '2', text: 'Выберите дату и свободное время', color: '#448AFF' },
              { step: '3', text: 'Подтвердите бронирование', color: '#00E5FF' },
              { step: '4', text: 'Откройте кабинку кнопкой, когда придёт время', color: '#00E676' },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: i < 3 ? 1.5 : 0 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${item.color}22`, color: item.color, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                }}>
                  {item.step}
                </Box>
                <Typography variant="body2" color="text.secondary">{item.text}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Book Button */}
        <Box component={motion.div} variants={itemVariants}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: { xs: 1.5, sm: 2 } }}>
            <Button
              variant="outlined"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate('/admin')}
              sx={{ borderColor: 'rgba(124,77,255,0.3)', py: 1.2 }}
            >
              Панель управления
            </Button>
            <Button
              variant="outlined"
              startIcon={<BusinessCenter />}
              onClick={() => navigate('/partner')}
              sx={{ borderColor: 'rgba(124,77,255,0.3)', py: 1.2 }}
            >
              Кабинет партнёра
            </Button>
          </Box>
          <Button
            variant="contained" fullWidth size="large"
            startIcon={<MapIcon />}
            endIcon={<ArrowForward />}
            onClick={() => navigate('/map')}
            component={motion.button}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            sx={{
              py: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.95rem', sm: '1.1rem' }, mb: { xs: 2, sm: 3 },
              background: 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 50%, #00E5FF 100%)',
              boxShadow: '0 8px 32px rgba(124, 77, 255, 0.4)',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(124, 77, 255, 0.6)',
              },
            }}
          >
            Забронировать кабинку
          </Button>
        </Box>

        {/* Active Bookings */}
        {loading ? (
          <Box component={motion.div} variants={itemVariants}>
            <Skeleton variant="rounded" height={120} sx={{ mb: 2, borderRadius: 3 }} />
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          </Box>
        ) : activeBookings.length > 0 && (
          <Box component={motion.div} variants={itemVariants}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 20, color: 'secondary.main' }} />
              Активные бронирования ({activeBookings.length})
            </Typography>
            <AnimatePresence>
              {activeBookings.map((b) => (
                <ActiveBookingCard key={b.id} booking={b} onRefresh={refreshCabinet} />
              ))}
            </AnimatePresence>
          </Box>
        )}

        {/* History Button */}
        <Box component={motion.div} variants={itemVariants}>
          <Button
            variant="outlined" fullWidth
            startIcon={<History />}
            onClick={() => setShowHistory(!showHistory)}
            sx={{
              mt: 2, py: 1.5,
              borderColor: 'rgba(124,77,255,0.3)',
              '&:hover': { borderColor: 'primary.main', background: 'rgba(124,77,255,0.1)' },
            }}
          >
            История бронирований {pastBookings.length > 0 && `(${pastBookings.length})`}
          </Button>
        </Box>

        {/* Booking History */}
        <Collapse in={showHistory}>
          <Box sx={{ mt: 2 }}>
            {pastBookings.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                Пока нет завершённых бронирований
              </Typography>
            ) : (
              <AnimatePresence>
                {pastBookings.map((b, i) => {
                  const start = new Date(b.start_time);
                  const end = new Date(b.end_time);
                  const durationHours = Math.round((end - start) / 3600000);
                  return (
                    <Card
                      key={b.id}
                      component={motion.div}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      sx={{ mb: 1.5, opacity: 0.7 }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{b.cabin_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(start, 'dd MMM yyyy, HH:mm', { locale: ru })} — {format(end, 'HH:mm', { locale: ru })}
                              {durationHours > 1 ? ` (${durationHours} ч)` : ''}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {b.review_rating ? (
                              <Chip size="small" icon={<StarRate sx={{ fontSize: 14 }} />} label={`${b.review_rating}/5`} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            ) : b.status === 'active' ? (
                              <Button size="small" variant="outlined" onClick={() => setReviewBooking(b)} sx={{ borderColor: 'rgba(124,77,255,0.3)' }}>
                                Оценить
                              </Button>
                            ) : null}
                            <Chip
                              size="small"
                              label={b.status === 'cancelled' ? 'Отменено' : 'Завершено'}
                              color={b.status === 'cancelled' ? 'error' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </AnimatePresence>
            )}
          </Box>
        </Collapse>

        {/* Profile Dialog */}
        <ProfileDialog
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          onUpdated={() => refreshUser && refreshUser()}
        />
        <TopUpDialog
          open={topUpOpen}
          onClose={() => setTopUpOpen(false)}
          onUpdated={refreshCabinet}
        />
        <ReviewDialog
          open={Boolean(reviewBooking)}
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSaved={refreshCabinet}
        />

      </Box>
    </Box>
  );
}
