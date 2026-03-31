import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Avatar, Chip, Skeleton,
  IconButton, Collapse, Divider, LinearProgress,
} from '@mui/material';
import {
  Map as MapIcon, History, VolumeOff, Lock, LockOpen,
  AccessTime, LocationOn, Logout, Cancel, ArrowForward,
  Wifi, AcUnit, UsbRounded, DesktopMac,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { format, isPast, isFuture, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

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
      await api.cancelBooking(booking.id);
      toast.success('Бронирование отменено');
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

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
          <Chip
            size="small"
            label={isActive ? 'Сейчас' : isUpcoming ? 'Скоро' : 'Завершено'}
            color={isActive ? 'success' : isUpcoming ? 'warning' : 'default'}
            sx={{ fontWeight: 600 }}
          />
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
              color="success"
              startIcon={<LockOpen />}
              fullWidth disabled
              sx={{ borderColor: 'success.main' }}
            >
              Кабинка открыта ✓
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err) {
      toast.error('Ошибка загрузки бронирований');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const activeBookings = bookings.filter((b) => b.status === 'active' && new Date(b.end_time) > now);
  const pastBookings = bookings.filter((b) => b.status !== 'active' || new Date(b.end_time) <= now);

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
            <Avatar sx={{
              width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 },
              background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
              fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.1rem' },
            }}>
              {avatarInitials}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Привет, {user?.name?.split(' ')[0]}!</Typography>
              <Typography variant="caption" color="text.secondary">Личный кабинет</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { logout(); navigate('/'); }} sx={{ color: 'text.secondary' }}>
            <Logout />
          </IconButton>
        </Box>

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
                <ActiveBookingCard key={b.id} booking={b} onRefresh={fetchBookings} />
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
                {pastBookings.map((b, i) => (
                  <Card
                    key={b.id}
                    component={motion.div}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    sx={{ mb: 1.5, opacity: 0.7 }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{b.cabin_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(b.start_time), 'dd MMM yyyy, HH:mm', { locale: ru })} — {format(new Date(b.end_time), 'HH:mm', { locale: ru })}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={b.status === 'cancelled' ? 'Отменено' : 'Завершено'}
                          color={b.status === 'cancelled' ? 'error' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </AnimatePresence>
            )}
          </Box>
        </Collapse>

      </Box>
    </Box>
  );
}
