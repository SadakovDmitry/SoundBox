import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Divider, MenuItem, Slider, Stack, TextField, Typography,
} from '@mui/material';
import {
  ArrowBack, ArrowForward, CheckCircle, Factory, Handshake, LocationCity,
  MonetizationOn, RocketLaunch, Storefront, SupportAgent,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api';

const packages = [
  {
    title: 'Pilot',
    price: 'от 1,2 млн ₽',
    booths: '1-2 кабинки',
    text: 'Для проверки спроса в бизнес-центре, вузе, коворкинге или торговой галерее.',
  },
  {
    title: 'City',
    price: 'от 3,6 млн ₽',
    booths: '3-6 кабинок',
    text: 'Для запуска точки с заметным охватом и регулярным потоком бронирований.',
  },
  {
    title: 'Network',
    price: 'индивидуально',
    booths: '7+ кабинок',
    text: 'Для партнеров, которые хотят развивать сеть точек в своем городе или регионе.',
  },
];

const included = [
  { icon: <Factory />, title: 'Кабинки собственного производства', text: 'Корпус, акустика, вентиляция, электрика и подготовка к подключению.' },
  { icon: <RocketLaunch />, title: 'Подключение платформы', text: 'Бронирование, карта, личный кабинет, управление доступом и история операций.' },
  { icon: <SupportAgent />, title: 'Операционная поддержка', text: 'Сценарии открытия точки, рекомендации по локации и базовые сервисные процессы.' },
];

const formatOptions = [
  'Бизнес-центр',
  'Вуз или кампус',
  'Коворкинг',
  'Торговый центр',
  'Городская сеть',
];

const currency = new Intl.NumberFormat('ru-RU');

export default function FranchisePage() {
  const [booths, setBooths] = useState(3);
  const [occupancy, setOccupancy] = useState(45);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    format: 'Бизнес-центр',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const estimate = useMemo(() => {
    const workingHours = 14;
    const pricePerHour = 200;
    const days = 30;
    const revenue = booths * workingHours * days * pricePerHour * (occupancy / 100);
    const serviceCosts = revenue * 0.28;
    return {
      revenue: Math.round(revenue),
      margin: Math.round(revenue - serviceCosts),
    };
  }, [booths, occupancy]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccess(null);
    try {
      const data = await api.submitFranchiseLead({
        ...form,
        message: `${form.message}\n\nКалькулятор: ${booths} кабинок, загрузка ${occupancy}%, оборот ${currency.format(estimate.revenue)} ₽/мес.`,
      });
      setSuccess(data);
      setForm({
        name: '',
        phone: '',
        email: '',
        city: '',
        format: 'Бизнес-центр',
        message: '',
      });
      toast.success('Заявка отправлена');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', background: '#0A0E1A', color: '#fff' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 20,
          backdropFilter: 'blur(24px)',
          background: 'rgba(10, 14, 26, 0.78)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Button component={RouterLink} to="/" startIcon={<ArrowBack />} sx={{ color: 'text.secondary' }}>
            На лендинг
          </Button>
          <Button component={RouterLink} to="/login" variant="outlined" endIcon={<ArrowForward />} sx={{ borderColor: 'rgba(255,255,255,0.18)' }}>
            Приложение
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          background:
            'radial-gradient(circle at 80% 4%, rgba(212,255,104,0.12), transparent 24%), radial-gradient(circle at 20% 16%, rgba(124,77,255,0.2), transparent 28%), linear-gradient(180deg, #0A0E1A 0%, #11182A 48%, #0A0E1A 100%)',
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 5, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.94fr 1.06fr' }, gap: { xs: 4, md: 7 }, alignItems: 'center' }}>
          <Box component={motion.section} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Chip label="Франшиза SoundBox" icon={<Handshake />} sx={{ mb: 2, color: '#D4FF68', background: 'rgba(212,255,104,0.09)' }} />
            <Typography component="h1" variant="h2" fontWeight={900} sx={{ fontSize: { xs: '2.35rem', md: '4rem' }, lineHeight: 1, letterSpacing: 0 }}>
              Запустите точку тихих кабинок в своем городе
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2.5, lineHeight: 1.65, maxWidth: 680 }}>
              Мы поставляем кабинки собственного производства, подключаем платформу бронирования и помогаем собрать операционную модель под локацию.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button href="#lead-form" variant="contained" size="large" startIcon={<Storefront />}>
                Оставить заявку
              </Button>
              <Button component={RouterLink} to="/login" variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.18)' }}>
                Открыть приложение
              </Button>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, background: 'rgba(15,20,38,0.78)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(22px)' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MonetizationOn sx={{ color: '#D4FF68' }} />
              <Typography variant="h5" fontWeight={900}>Калькулятор точки</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Быстрая оценка месячного оборота по базовому тарифу бронирования.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography fontWeight={700}>Количество кабинок: {booths}</Typography>
              <Slider min={1} max={12} value={booths} onChange={(_, value) => setBooths(value)} marks={[{ value: 1, label: '1' }, { value: 6, label: '6' }, { value: 12, label: '12' }]} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography fontWeight={700}>Средняя загрузка: {occupancy}%</Typography>
              <Slider min={20} max={85} step={5} value={occupancy} onChange={(_, value) => setOccupancy(value)} marks={[{ value: 20, label: '20%' }, { value: 50, label: '50%' }, { value: 85, label: '85%' }]} />
            </Box>
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.18)' }}>
                <Typography variant="caption" color="text.secondary">Оборот в месяц</Typography>
                <Typography variant="h5" fontWeight={900}>{currency.format(estimate.revenue)} ₽</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(212,255,104,0.08)', border: '1px solid rgba(212,255,104,0.18)' }}>
                <Typography variant="caption" color="text.secondary">После базовых расходов</Typography>
                <Typography variant="h5" fontWeight={900}>{currency.format(estimate.margin)} ₽</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 6, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {packages.map((item) => (
            <Box key={item.title} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="overline" color="text.secondary">{item.booths}</Typography>
              <Typography variant="h5" fontWeight={900}>{item.title}</Typography>
              <Typography variant="h6" sx={{ color: '#00E5FF', mt: 1 }}>{item.price}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>{item.text}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 7, md: 9 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' }, gap: { xs: 4, md: 6 }, alignItems: 'start' }}>
          <Box>
            <Chip label="Что входит" sx={{ mb: 2, color: '#9AF4FF', background: 'rgba(0,229,255,0.08)' }} />
            <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.65rem' }, letterSpacing: 0 }}>
              Франшиза связана с готовой платформой бронирования
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              Партнерская точка получает те же сценарии, которые уже есть в приложении: карта, слоты, бронирования, личный кабинет и управление доступом.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {included.map((item) => (
              <Box key={item.title} sx={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 1.5, p: 2, borderRadius: 2, background: 'rgba(15,20,38,0.72)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ width: 46, height: 46, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#00E5FF', background: 'rgba(0,229,255,0.08)' }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography fontWeight={800}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>{item.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box id="lead-form" sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 8, md: 10 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.82fr 1.18fr' }, gap: { xs: 4, md: 6 } }}>
          <Box sx={{ pt: { md: 2 } }}>
            <Chip icon={<LocationCity />} label="Заявка партнеру" sx={{ mb: 2, color: '#D4FF68', background: 'rgba(212,255,104,0.08)' }} />
            <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.65rem' }, letterSpacing: 0 }}>
              Расскажите, где хотите открыть SoundBox
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              Оставьте контакты, и мы обсудим формат запуска, город и подходящее количество кабинок.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, background: 'rgba(15,20,38,0.78)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {success && (
              <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                Заявка #{success.leadId} принята. Мы свяжемся с вами после первичного анализа города и формата.
              </Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Имя" value={form.name} onChange={handleChange('name')} required />
              <TextField label="Телефон" value={form.phone} onChange={handleChange('phone')} required />
              <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} />
              <TextField label="Город" value={form.city} onChange={handleChange('city')} required />
              <TextField select label="Формат локации" value={form.format} onChange={handleChange('format')} required sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                {formatOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Комментарий"
                value={form.message}
                onChange={handleChange('message')}
                multiline
                minRows={4}
                sx={{ gridColumn: '1 / -1' }}
                placeholder="Например: есть помещение в бизнес-центре, хотим начать с трех кабинок"
              />
            </Box>
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 2.5 }} endIcon={<ArrowForward />}>
              {loading ? 'Отправляем...' : 'Отправить заявку'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
