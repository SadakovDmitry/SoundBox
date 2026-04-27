import { useState, useEffect, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Rating, Skeleton, Divider, Alert,
} from '@mui/material';
import {
  ArrowBack, VolumeOff, AccessTime, LocationOn, Close,
  EventAvailable, CheckCircle, MyLocation, AccountBalanceWallet,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, addDays, addMinutes, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Transition that properly implements MUI's Transition API
// motion.div alone does NOT work because MUI Dialog needs the `in` prop respected
const MotionTransition = forwardRef(function MotionTransition(props, ref) {
  const { in: open, children, onEnter, onExited, ...other } = props;

  useEffect(() => {
    if (open && onEnter) onEnter();
  }, [open, onEnter]);

  useEffect(() => {
    if (!open && onExited) {
      const timer = setTimeout(onExited, 300);
      return () => clearTimeout(timer);
    }
  }, [open, onExited]);

  if (!open) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      {...other}
    >
      {children}
    </motion.div>
  );
});

function createCabinIcon(status = 'free') {
  const palette = {
    free: {
      background: 'linear-gradient(135deg, #7C4DFF, #448AFF)',
      shadow: '0 4px 20px rgba(124,77,255,0.5)',
    },
    soon: {
      background: 'linear-gradient(135deg, #FFD740, #FF9100)',
      shadow: '0 4px 20px rgba(255, 215, 64, 0.45)',
    },
    occupied: {
      background: 'linear-gradient(135deg, #FF5252, #FF1744)',
      shadow: '0 4px 20px rgba(255,82,82,0.5)',
    },
  };
  const colors = palette[status] || palette.free;

  return L.divIcon({
    html: `
      <div style="
        width: 44px; height: 44px; border-radius: 50%;
        background: ${colors.background};
        display: flex; align-items: center; justify-content: center;
        box-shadow: ${colors.shadow};
        border: 3px solid rgba(255,255,255,0.9);
        cursor: pointer;
        animation: marker-pulse 2s infinite;
        position: relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      </div>
      <style>
        @keyframes marker-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      </style>
    `,
    className: 'cabin-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

// ─── User Location Marker ────────────────────────────────────
function UserLocationMarker() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!position) return null;

  return (
    <>
      <CircleMarker center={position} radius={24}
        pathOptions={{ fillColor: '#448AFF', fillOpacity: 0.15, stroke: false }} />
      <CircleMarker center={position} radius={8}
        pathOptions={{ fillColor: '#448AFF', fillOpacity: 1, color: '#fff', weight: 3 }} />
    </>
  );
}

function FlyToUser() {
  const map = useMap();

  const handleClick = () => {
    if (!navigator.geolocation) {
      toast.error('Геолокация не поддерживается');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 }),
      () => toast.error('Не удалось определить местоположение'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      sx={{ position: 'absolute', top: { xs: 60, sm: 70 }, left: { xs: 12, sm: 16 }, zIndex: 1000 }}
    >
      <IconButton
        onClick={handleClick}
        sx={{
          background: 'rgba(15, 20, 38, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(68, 138, 255, 0.3)',
          color: '#448AFF',
          width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 },
          '&:hover': { background: 'rgba(15, 20, 38, 0.95)', color: '#82B1FF' },
        }}
      >
        <MyLocation sx={{ fontSize: { xs: 18, sm: 20 } }} />
      </IconButton>
    </Box>
  );
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function BookingTimePicker({ selectedDate, cabinId, onIntervalChange }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ startIndex: null, endIndex: null });

  useEffect(() => {
    if (!selectedDate) return;
    queueMicrotask(() => {
      setLoading(true);
      setRange({ startIndex: null, endIndex: null });
      onIntervalChange(null);
    });
    const nextDate = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    Promise.all([
      api.getCabinBookings(cabinId, selectedDate),
      api.getCabinBookings(cabinId, nextDate),
    ])
      .then(([today, tomorrow]) => setBookings([...today, ...tomorrow]))
      .catch(() => toast.error('Ошибка загрузки свободного времени'))
      .finally(() => setLoading(false));
  }, [cabinId, onIntervalChange, selectedDate]);

  const slots = useMemo(() => {
    const day = parseISO(selectedDate);
    const now = new Date();
    return Array.from({ length: 48 }, (_, index) => {
      const start = addMinutes(day, index * 30);
      const end = addMinutes(start, 30);
      const isFinished = end <= now;
      const isCurrent = start <= now && end > now;
      const isBooked = bookings.some((b) => {
        const bs = new Date(b.start_time);
        const be = new Date(b.end_time);
        return start < be && end > bs;
      });
      return {
        index,
        start,
        end,
        label: format(start, 'HH:mm'),
        caption: format(end, 'HH:mm'),
        isFinished,
        isCurrent,
        isBooked,
      };
    });
  }, [bookings, selectedDate]);

  const selectedInterval = useMemo(() => {
    if (range.startIndex === null || range.endIndex === null) return null;
    const startSlot = slots[range.startIndex];
    const endSlot = slots[range.endIndex];
    if (!startSlot || !endSlot || range.endIndex < range.startIndex) return null;

    const start = startSlot.start;
    const end = endSlot.end;
    const minutes = Math.round((end - start) / 60000);
    const selectedSlots = slots.slice(range.startIndex, range.endIndex + 1);
    const hasConflict = selectedSlots.some((slot) => slot.isBooked);
    const isFinished = end <= new Date();
    const isValidDuration = minutes >= 30 && minutes % 30 === 0;

    return {
      start,
      end,
      durationMinutes: minutes,
      hasConflict,
      isFinished,
      isValidDuration,
      canBook: !isFinished && isValidDuration && !hasConflict,
      endValue: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
      startValue: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
      label: `${format(start, 'HH:mm')} — ${format(end, 'HH:mm')}`,
    };
  }, [range.endIndex, range.startIndex, slots]);

  useEffect(() => {
    onIntervalChange(selectedInterval);
  }, [onIntervalChange, selectedInterval]);

  const handleSlotClick = (slot) => {
    if (slot.isFinished || slot.isBooked) return;

    setRange((prev) => {
      if (prev.startIndex === null || prev.endIndex !== null || slot.index < prev.startIndex) {
        return { startIndex: slot.index, endIndex: null };
      }
      return { startIndex: prev.startIndex, endIndex: slot.index };
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' }, gap: 0.75 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Нажмите первый 30-минутный слот как начало, затем второй слот как конец диапазона.
      </Typography>
      <Box sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' }, gap: 0.75 }}>
          {slots.map((slot) => {
            const isStart = range.startIndex === slot.index;
            const isEnd = range.endIndex === slot.index;
            const inRange = range.startIndex !== null && range.endIndex !== null && slot.index >= range.startIndex && slot.index <= range.endIndex;
            const disabled = slot.isFinished || slot.isBooked;
            return (
              <Button
                key={slot.index}
                onClick={() => handleSlotClick(slot)}
                disabled={disabled}
                component={motion.button}
                whileHover={!disabled ? { scale: 1.03 } : {}}
                sx={{
                  minWidth: 0,
                  height: 52,
                  borderRadius: 2,
                  flexDirection: 'column',
                  lineHeight: 1.1,
                  color: isStart || isEnd || inRange ? '#fff' : 'text.primary',
                  opacity: slot.isFinished ? 0.32 : 1,
                  background: isStart || isEnd
                    ? 'linear-gradient(135deg, #7C4DFF, #448AFF)'
                    : inRange
                      ? 'rgba(124,77,255,0.24)'
                      : slot.isBooked
                        ? 'rgba(255,82,82,0.16)'
                        : slot.isCurrent
                          ? 'rgba(212,255,104,0.14)'
                          : 'rgba(255,255,255,0.05)',
                  border: slot.isBooked
                    ? '1px solid rgba(255,82,82,0.28)'
                    : slot.isCurrent
                      ? '1px solid rgba(212,255,104,0.42)'
                      : '1px solid rgba(255,255,255,0.1)',
                  '&:hover': {
                    background: disabled ? undefined : 'rgba(124,77,255,0.2)',
                  },
                  '&.Mui-disabled': {
                    color: slot.isBooked ? '#FF8A80' : 'rgba(255,255,255,0.36)',
                  },
                }}
              >
                <Typography variant="body2" fontWeight={900}>{slot.label}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.72 }}>{slot.caption}</Typography>
              </Button>
            );
          })}
        </Box>
      </Box>

      {selectedInterval && (
        <Alert
          severity={selectedInterval.canBook ? 'success' : 'warning'}
          variant="outlined"
          sx={{ mt: 2, borderRadius: 2 }}
        >
          {selectedInterval.isFinished && 'Выбранный интервал уже закончился.'}
          {!selectedInterval.isFinished && selectedInterval.hasConflict && 'В выбранном диапазоне есть занятый слот. Выберите другой промежуток.'}
          {selectedInterval.canBook && `Интервал свободен: ${selectedInterval.label}, ${formatDuration(selectedInterval.durationMinutes)}`}
        </Alert>
      )}
    </Box>
  );
}

function DateStrip({ value, onChange }) {
  const days = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const date = addDays(new Date(), index);
    const iso = format(date, 'yyyy-MM-dd');
    return {
      iso,
      day: format(date, 'd', { locale: ru }),
      weekday: format(date, 'EEE', { locale: ru }).replace('.', ''),
      label: index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : format(date, 'd MMM', { locale: ru }),
    };
  }), []);

  return (
    <Box
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: { xs: '96px', sm: '108px' },
        gap: 1,
        overflowX: 'auto',
        pb: 1,
        mb: 2,
        scrollbarWidth: 'thin',
      }}
    >
      {days.map((day) => {
        const selected = value === day.iso;
        return (
          <Button
            key={day.iso}
            onClick={() => onChange(day.iso)}
            variant={selected ? 'contained' : 'outlined'}
            sx={{
              minWidth: 0,
              height: 74,
              borderRadius: 3,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 1.5,
              py: 1,
              background: selected ? 'linear-gradient(135deg, #7C4DFF, #448AFF)' : 'rgba(255,255,255,0.04)',
              borderColor: selected ? 'transparent' : 'rgba(124,77,255,0.28)',
              boxShadow: selected ? '0 12px 28px rgba(124,77,255,0.28)' : 'none',
              color: '#fff',
              '&:hover': {
                background: selected ? 'linear-gradient(135deg, #7C4DFF, #448AFF)' : 'rgba(124,77,255,0.12)',
              },
            }}
          >
            <Typography variant="caption" sx={{ color: selected ? 'rgba(255,255,255,0.8)' : 'text.secondary', textTransform: 'none' }}>
              {day.label}
            </Typography>
            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
              {day.day}
            </Typography>
            <Typography variant="caption" sx={{ color: selected ? 'rgba(255,255,255,0.75)' : 'secondary.main', textTransform: 'uppercase' }}>
              {day.weekday}
            </Typography>
          </Button>
        );
      })}
    </Box>
  );
}

function BookingModal({ open, cabin, onClose, onBooked }) {
  const { user, refreshUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedInterval, setSelectedInterval] = useState(null);
  const [booking, setBooking] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedInterval(null);
    }
  }, [open]);

  const amenities = cabin ? JSON.parse(cabin.amenities || '[]') : [];

  const billableMinutes = selectedInterval?.durationMinutes || 0;
  const totalPrice = Math.round((billableMinutes / 60) * (cabin?.price_per_hour || 200));
  const balance = user?.balance || 0;
  const canBook = Boolean(selectedInterval?.canBook);
  const notEnoughMoney = canBook && balance < totalPrice;

  const handleBook = async () => {
    if (!selectedInterval) {
      toast.error('Выберите начало и конец бронирования');
      return;
    }
    if (!selectedInterval.isValidDuration) {
      toast.error('Длительность должна быть кратна 30 минутам');
      return;
    }
    if (selectedInterval?.isFinished) {
      toast.error('Выбранный интервал уже закончился');
      return;
    }
    if (selectedInterval?.hasConflict) {
      toast.error('Выбранный интервал пересекается с другой бронью');
      return;
    }
    if (notEnoughMoney) {
      toast.error('Недостаточно средств. Пополните кошелёк в личном кабинете');
      return;
    }
    setBooking(true);
    try {
      await api.createBulkBooking(cabin.id, [{ start: selectedInterval.startValue, end: selectedInterval.endValue }]);
      await refreshUser?.();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C4DFF', '#00E5FF', '#00E676', '#FFD740'],
      });
      toast.success(`🎉 Забронировано на ${formatDuration(selectedInterval.durationMinutes)}!`, {
        style: { background: '#1a1a2e', color: '#fff', border: '1px solid #7C4DFF' },
        duration: 4000,
      });
      // Auto-close modal after short delay
      setTimeout(() => {
        onClose(true);
        if (onBooked) onBooked();
      }, 800);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (!cabin) return null;

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="sm"
      fullWidth
      fullScreen={window.innerWidth < 600}
      scroll="paper"
      TransitionComponent={MotionTransition}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 40, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 40, scale: 0.95 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        sx: {
          maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 48px)' },
          display: 'flex',
          overflow: 'hidden',
          background: 'rgba(10, 14, 26, 0.98)',
          ...(window.innerWidth < 600 ? { borderRadius: 0 } : {}),
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2 } }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{cabin.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LocationOn sx={{ fontSize: 14 }} />
            <Typography variant="caption">{cabin.address}</Typography>
          </Box>
        </Box>
        <IconButton onClick={() => onClose(false)} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          pt: 1,
          px: { xs: 2, sm: 3 },
          overflowY: 'auto',
          borderColor: 'rgba(255,255,255,0.08)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {cabin.description}
        </Typography>

        {/* Rating & Price */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={cabin.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" fontWeight={600}>{cabin.rating}</Typography>
          </Box>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'secondary.main' }}>
            {cabin.price_per_hour} ₽<Typography variant="caption" color="text.secondary"> / час</Typography>
          </Typography>
        </Box>

        {/* Amenities */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
          {amenities.map((a) => (
            <Chip key={a} label={a} size="small" variant="outlined"
              sx={{ borderColor: 'rgba(124,77,255,0.3)', fontSize: '0.7rem' }} />
          ))}
        </Box>

        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Date Picker */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailable sx={{ fontSize: 18, color: 'primary.main' }} /> Выберите дату
        </Typography>
        <DateStrip
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setSelectedInterval(null);
          }}
        />

        {/* Time Selection */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ fontSize: 18, color: 'primary.main' }} /> Выберите время
        </Typography>
        <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-icon': { color: 'primary.main' } }}>
          <Typography variant="caption">Сначала нажмите слот начала, затем слот конца. Каждый слот длится 30 минут; текущий свободный слот тоже доступен для бронирования.</Typography>
        </Alert>
        <BookingTimePicker
          selectedDate={selectedDate}
          cabinId={cabin.id}
          onIntervalChange={setSelectedInterval}
        />

        {/* Selected summary */}
        {canBook && (
          <Box sx={{
            mt: 2, p: 1.5, borderRadius: 2,
            background: 'rgba(124, 77, 255, 0.1)',
            border: '1px solid rgba(124, 77, 255, 0.3)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Выбрано: <strong style={{ color: '#B388FF' }}>{selectedInterval.label}, {formatDuration(selectedInterval.durationMinutes)}</strong>
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'secondary.main' }}>
                {totalPrice} ₽
              </Typography>
            </Box>
          </Box>
        )}
        {notEnoughMoney && (
          <Alert severity="warning" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
            На балансе {balance} ₽. Пополните кошелёк в личном кабинете, чтобы завершить бронирование.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 },
        alignItems: { xs: 'stretch', sm: 'center' },
        background: 'rgba(10, 14, 26, 0.98)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        '& > button': { width: { xs: '100%', sm: 'auto' } },
      }}>
        <Chip
          icon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
          label={`Баланс: ${balance} ₽`}
          variant="outlined"
          sx={{
            mr: { xs: 0, sm: 'auto' },
            borderColor: 'rgba(124,77,255,0.35)',
            color: 'text.secondary',
            justifyContent: 'flex-start',
            width: { xs: '100%', sm: 'auto' },
          }}
        />
        <Button variant="outlined" onClick={() => onClose(false)} sx={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          Отмена
        </Button>
        <Button
          variant="contained" onClick={handleBook} disabled={booking || !canBook || notEnoughMoney}
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          startIcon={<CheckCircle />}
        >
          {booking ? 'Бронирование...' : 'Забронировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cabins, setCabins] = useState([]);
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCabins = async () => {
    try {
      const data = await api.getCabins();
      setCabins(data);
    } catch {
      toast.error('Ошибка загрузки кабинок');
    }
  };

  useEffect(() => {
    queueMicrotask(fetchCabins);
  }, []);

  const handleMarkerClick = (cabin) => {
    setSelectedCabin(cabin);
    setModalOpen(true);
  };

  const handleModalClose = (booked) => {
    setModalOpen(false);
    if (booked) fetchCabins();
  };

  const handleBooked = () => {
    // Navigate to dashboard after a short delay to let the user see confetti
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  return (
    <Box sx={{ height: '100dvh', position: 'relative', background: '#0A0E1A' }}>
      {/* Back Button */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 1000 }}
      >
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{
            background: 'rgba(15, 20, 38, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124, 77, 255, 0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            fontSize: { xs: '0.8rem', sm: '0.95rem' },
            px: { xs: 1.5, sm: 3 }, py: { xs: 0.75, sm: 1 },
            '&:hover': { background: 'rgba(15, 20, 38, 0.95)' },
          }}
        >
          Назад
        </Button>
      </Box>

      {/* Header badges */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        sx={{
          position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 1000,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <Box
          sx={{
          background: 'rgba(15, 20, 38, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 77, 255, 0.2)',
          borderRadius: 2, px: { xs: 1.5, sm: 2 }, py: { xs: 0.5, sm: 0.75 },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccountBalanceWallet sx={{ fontSize: 14, color: 'secondary.main' }} />
            {user?.balance || 0} ₽
          </Typography>
        </Box>
        <Box
          sx={{
            background: 'rgba(15, 20, 38, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124, 77, 255, 0.2)',
            borderRadius: 2, px: { xs: 1.5, sm: 2 }, py: { xs: 0.5, sm: 0.75 },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn sx={{ fontSize: 14, color: 'primary.main' }} />
            {cabins.length} кабинок
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        sx={{
          position: 'absolute', bottom: { xs: 16, sm: 24 }, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, display: 'flex', gap: { xs: 1.5, sm: 2 },
          background: 'rgba(15, 20, 38, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 77, 255, 0.2)',
          borderRadius: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 1.5 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg, #7C4DFF, #448AFF)' }} />
          <Typography variant="caption" color="text.secondary">Свободна</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD740, #FF9100)' }} />
          <Typography variant="caption" color="text.secondary">Скоро бронь</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg, #FF5252, #FF1744)' }} />
          <Typography variant="caption" color="text.secondary">Занята</Typography>
        </Box>
      </Box>

      {/* Map */}
      <MapContainer
        center={[55.7558, 37.6173]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {cabins.map((cabin) => (
          <Marker
            key={cabin.id}
            position={[cabin.lat, cabin.lng]}
            icon={createCabinIcon(cabin.status)}
            eventHandlers={{
              click: () => handleMarkerClick(cabin),
            }}
          />
        ))}
        <UserLocationMarker />
        <FlyToUser />
      </MapContainer>

      {/* Booking Modal */}
      <BookingModal
        open={modalOpen}
        cabin={selectedCabin}
        onClose={handleModalClose}
        onBooked={handleBooked}
      />
    </Box>
  );
}
