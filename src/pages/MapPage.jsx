import { useState, useEffect, useMemo, forwardRef } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Rating, Skeleton, Divider, Alert,
} from '@mui/material';
import {
  ArrowBack, VolumeOff, AccessTime, LocationOn, Star, Close,
  EventAvailable, CheckCircle, MyLocation,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { format, addHours, setHours, setMinutes, startOfDay, isBefore, parseISO } from 'date-fns';
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

function createCabinIcon(isBooked) {
  return L.divIcon({
    html: `
      <div style="
        width: 44px; height: 44px; border-radius: 50%;
        background: ${isBooked
        ? 'linear-gradient(135deg, #FF5252, #FF1744)'
        : 'linear-gradient(135deg, #7C4DFF, #448AFF)'};
        display: flex; align-items: center; justify-content: center;
        box-shadow: ${isBooked
        ? '0 4px 20px rgba(255,82,82,0.5)'
        : '0 4px 20px rgba(124,77,255,0.5)'};
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

function TimeSlotPicker({ selectedDate, cabinId, onToggle, selectedSlots }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    api.getCabinBookings(cabinId, selectedDate)
      .then(setBookings)
      .catch(() => toast.error('Ошибка загрузки слотов'))
      .finally(() => setLoading(false));
  }, [cabinId, selectedDate]);

  const slots = useMemo(() => {
    const result = [];
    const day = startOfDay(parseISO(selectedDate));
    const now = new Date();
    for (let h = 8; h < 22; h++) {
      const start = setMinutes(setHours(day, h), 0);
      const end = addHours(start, 1);
      const isPast = isBefore(start, now);
      const isBooked = bookings.some((b) => {
        const bs = new Date(b.start_time);
        const be = new Date(b.end_time);
        return start < be && end > bs;
      });
      result.push({
        start: start.toISOString(),
        end: end.toISOString(),
        label: `${String(h).padStart(2, '0')}:00 — ${String(h + 1).padStart(2, '0')}:00`,
        hour: h,
        isPast,
        isBooked,
        bookedBy: isBooked ? bookings.find((b) => {
          const bs = new Date(b.start_time);
          const be = new Date(b.end_time);
          return start < be && end > bs;
        })?.user_name : null,
      });
    }
    return result;
  }, [bookings, selectedDate]);

  if (loading) return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} variant="rounded" width={100} height={40} sx={{ borderRadius: 2, flex: { xs: '1 1 calc(50% - 8px)', sm: '0 0 auto' } }} />)}</Box>;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, sm: 1 } }}>
      {slots.map((slot) => {
        const isSelected = selectedSlots.some(s => s.start === slot.start);
        return (
          <Chip
            key={slot.hour}
            label={slot.label}
            onClick={() => !slot.isBooked && !slot.isPast && onToggle(slot)}
            component={motion.div}
            whileHover={!slot.isBooked && !slot.isPast ? { scale: 1.05 } : {}}
            whileTap={!slot.isBooked && !slot.isPast ? { scale: 0.95 } : {}}
            sx={{
              px: { xs: 0.5, sm: 1 }, py: 2.5, fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 600, flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 auto' }, minWidth: { xs: 0, sm: 'auto' },
              cursor: slot.isBooked || slot.isPast ? 'not-allowed' : 'pointer',
              opacity: slot.isPast ? 0.3 : 1,
              background: isSelected
                ? 'linear-gradient(135deg, #7C4DFF, #448AFF)'
                : slot.isBooked
                  ? 'rgba(255, 82, 82, 0.15)'
                  : 'rgba(255,255,255,0.05)',
              color: isSelected ? '#fff' : slot.isBooked ? '#FF5252' : 'text.primary',
              border: isSelected
                ? '1px solid #7C4DFF'
                : slot.isBooked
                  ? '1px solid rgba(255,82,82,0.3)'
                  : '1px solid rgba(255,255,255,0.1)',
              '&:hover': {
                background: slot.isBooked || slot.isPast ? undefined : 'rgba(124, 77, 255, 0.2)',
              },
            }}
          />
        );
      })}
    </Box>
  );
}

function BookingModal({ open, cabin, onClose, onBooked }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [booking, setBooking] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedSlots([]);
    }
  }, [open]);

  const amenities = cabin ? JSON.parse(cabin.amenities || '[]') : [];

  const handleToggleSlot = (slot) => {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.start === slot.start);
      if (exists) {
        return prev.filter(s => s.start !== slot.start);
      }
      return [...prev, { start: slot.start, end: slot.end }].sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );
    });
  };

  const totalHours = selectedSlots.length;
  const totalPrice = totalHours * (cabin?.price_per_hour || 200);

  const handleBook = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Выберите хотя бы один слот');
      return;
    }
    setBooking(true);
    try {
      for (const slot of selectedSlots) {
        await api.createBooking(cabin.id, slot.start, slot.end);
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C4DFF', '#00E5FF', '#00E676', '#FFD740'],
      });
      const word = totalHours === 1 ? 'слот' : totalHours < 5 ? 'слота' : 'слотов';
      toast.success(`🎉 Забронировано ${totalHours} ${word}!`, {
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
      TransitionComponent={MotionTransition}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 40, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 40, scale: 0.95 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        ...(window.innerWidth < 600 ? { sx: { background: 'rgba(10, 14, 26, 0.98)', borderRadius: 0 } } : {}),
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

      <DialogContent sx={{ pt: 1, px: { xs: 2, sm: 3 } }}>
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
        <TextField
          type="date"
          fullWidth
          size="small"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlots([]); }}
          inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
          sx={{ mb: 2 }}
        />

        {/* Time Slots */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ fontSize: 18, color: 'primary.main' }} /> Выберите время
        </Typography>
        <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-icon': { color: 'primary.main' } }}>
          <Typography variant="caption">🔴 Занято другими пользователями &nbsp; 🟣 Ваш выбор &nbsp; Можно выбрать несколько слотов</Typography>
        </Alert>
        <TimeSlotPicker
          selectedDate={selectedDate}
          cabinId={cabin.id}
          onToggle={handleToggleSlot}
          selectedSlots={selectedSlots}
        />

        {/* Selected summary */}
        {selectedSlots.length > 0 && (
          <Box sx={{
            mt: 2, p: 1.5, borderRadius: 2,
            background: 'rgba(124, 77, 255, 0.1)',
            border: '1px solid rgba(124, 77, 255, 0.3)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Выбрано: <strong style={{ color: '#B388FF' }}>{totalHours} {totalHours === 1 ? 'час' : totalHours < 5 ? 'часа' : 'часов'}</strong>
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'secondary.main' }}>
                {totalPrice} ₽
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
        <Button variant="outlined" onClick={() => onClose(false)} sx={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          Отмена
        </Button>
        <Button
          variant="contained" onClick={handleBook} disabled={booking || selectedSlots.length === 0}
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          startIcon={<CheckCircle />}
        >
          {booking ? 'Бронирование...' : selectedSlots.length > 1 ? `Забронировать ${selectedSlots.length} слота` : 'Забронировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCabins = async () => {
    try {
      const data = await api.getCabins();
      setCabins(data);
    } catch {
      toast.error('Ошибка загрузки кабинок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCabins(); }, []);

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

      {/* My Location Button */}
      <FlyToUser />

      {/* Cabin count badge */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        sx={{
          position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 1000,
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
            icon={createCabinIcon(false)}
            eventHandlers={{
              click: () => handleMarkerClick(cabin),
            }}
          />
        ))}
        <UserLocationMarker />
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
