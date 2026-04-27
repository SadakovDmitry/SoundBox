import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Chip, Divider, IconButton, Stack, Typography,
} from '@mui/material';
import {
  Analytics, Apartment, ArrowForward, CheckCircle, Factory, Handshake,
  HeadsetMic, Login, Map as MapIcon, MonetizationOn, Payments, School,
  Shield, Speed, Storefront, SupportAgent, Train, TrendingUp, VolumeOff,
  Workspaces,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import SoundBoxModel from '../components/SoundBoxModel';
import kalininPhoto from '../assets/team/kalinin-mikhail.png';
import kuznetsovPhoto from '../assets/team/kuznetsov-ivan.png';
import baklykovaPhoto from '../assets/team/baklykova-alina.png';
import sadakovPhoto from '../assets/team/sadakov-dmitry.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const valueCards = [
  {
    icon: <VolumeOff />,
    title: 'Тишина там, где ее не хватает',
    text: 'SoundBox решает понятную боль офисов, вузов, ТЦ и коворкингов: людям нужно место для звонка, фокуса и короткой работы без шума.',
  },
  {
    icon: <MapIcon />,
    title: 'Удобное бронирование',
    text: 'Пользователь видит кабинки на карте, выбирает свободное время, управляет бронью в личном кабинете и открывает кабинку в нужный момент.',
  },
  {
    icon: <Factory />,
    title: 'Контроль продукта внутри команды',
    text: 'Кабинки проектируются и собираются под единый стандарт SoundBox, поэтому в разных локациях сохраняется одинаковый уровень качества.',
  },
  {
    icon: <TrendingUp />,
    title: 'Модель для масштабирования',
    text: 'Партнер получает физический продукт, платформу бронирования и понятный операционный сценарий для запуска точки.',
  },
];

const strengths = [
  { icon: <CheckCircle />, label: 'Готовый пользовательский путь', text: 'От регистрации до бронирования и открытия кабинки все собрано в одном сценарии.' },
  { icon: <Payments />, label: 'Простая экономика', text: 'Почасовая бронь делает выручку понятной, а загрузку легко считать по каждой точке.' },
  { icon: <Shield />, label: 'Единый стандарт качества', text: 'Собственное производство помогает держать одинаковый уровень кабинок в разных локациях.' },
  { icon: <HeadsetMic />, label: 'Сильный B2B-сценарий', text: 'Кабинки подходят бизнес-центрам, университетам, коворкингам, ТЦ и вокзалам.' },
  { icon: <Analytics />, label: 'Данные для роста', text: 'Платформа собирает бронирования, историю и статусы, чтобы дальше развивать аналитику.' },
  { icon: <SupportAgent />, label: 'Понятный сервис', text: 'Пользователь сам бронирует время и получает доступ без лишнего общения с администратором.' },
];

const audienceCards = [
  {
    icon: <Apartment />,
    title: 'Бизнес-центры',
    pain: 'Шумные open-space зоны и нехватка приватных мест для звонков.',
    benefit: 'Арендаторы получают быстрый доступ к тихому рабочему месту.',
    money: 'Площадка зарабатывает на почасовой загрузке кабинок.',
  },
  {
    icon: <School />,
    title: 'Университеты',
    pain: 'Студентам сложно найти место для созвона, подготовки или онлайн-занятия.',
    benefit: 'Кампус получает современный сервис для учебы и проектной работы.',
    money: 'Доход формируется через бронирования студентами и резидентами.',
  },
  {
    icon: <Workspaces />,
    title: 'Коворкинги',
    pain: 'Переговорки заняты, а короткие звонки перегружают общие зоны.',
    benefit: 'Кабинки разгружают переговорные и повышают ценность пространства.',
    money: 'Коворкинг продает отдельный paid-сервис поверх базового тарифа.',
  },
  {
    icon: <Train />,
    title: 'ТЦ и вокзалы',
    pain: 'В местах с потоком людей почти нет приватности для срочных дел.',
    benefit: 'Посетитель может быстро провести звонок или поработать между встречами.',
    money: 'Высокий трафик помогает быстрее набирать загрузку по часам.',
  },
];

const workSteps = [
  'Выбираем локацию и место установки',
  'Устанавливаем звукоизолированную кабинку',
  'Подключаем платформу бронирования',
  'Пользователи выбирают время в приложении',
  'Владелец точки получает доход от бронирований',
];

const economyCases = [
  { cabins: '1 кабинка', hours: '50 ч/мес', revenue: '10 000 ₽', note: 'подходит для теста спроса' },
  { cabins: '3 кабинки', hours: '150 ч/мес', revenue: '30 000 ₽', note: 'формат для бизнес-центра или вуза' },
  { cabins: '5 кабинок', hours: '250 ч/мес', revenue: '50 000 ₽', note: 'мини-сеть внутри крупной локации' },
];

const trustPoints = [
  'Собственное производство и единый стандарт сборки',
  'Цифровая платформа с бронированием, кошельком и историей',
  'Управление доступом во время активной брони',
  'Модель масштабируется от одной точки до сети кабинок',
];

const productionSteps = [
  'Проектируем форму кабины, акустический контур и внутреннюю эргономику',
  'Собираем модули, вентиляцию, электрику и элементы доступа',
  'Проверяем качество, безопасность и готовность к установке на точке',
  'Подключаем кабинку к платформе бронирования SoundBox',
];

const metrics = [
  { value: '10', label: 'локаций по Москве' },
  { value: '24/7', label: 'кабинки работают круглосуточно' },
  { value: '200 ₽', label: 'базовая цена часа' },
];

const mvpFeatures = [
  { icon: <MapIcon />, label: 'Карта кабинок' },
  { icon: <Speed />, label: 'Быстрый выбор слотов' },
  { icon: <Shield />, label: 'Проверка конфликтов' },
  { icon: <Analytics />, label: 'История бронирований' },
];

const teamMembers = [
  {
    name: 'Калинин Михаил',
    role: 'Тимлид',
    photo: kalininPhoto,
    text: 'Отвечает за организацию команды и общий ход проекта. Имеет опыт проведения мероприятий и самостоятельных проектов в разных сферах.',
  },
  {
    name: 'Кузнецов Иван',
    role: 'Дизайнер',
    photo: kuznetsovPhoto,
    text: 'Проектирует интерфейсы и переводит сложные логические схемы в простые, понятные пользовательские сценарии.',
  },
  {
    name: 'Баклыкова Алина',
    role: 'Менеджер',
    photo: baklykovaPhoto,
    text: 'Координирует процессы, работу команды и проектные задачи. Имеет техническую базу и опыт участия в IT-проектах.',
  },
  {
    name: 'Садаков Дмитрий',
    role: 'Разработчик',
    photo: sadakovPhoto,
    text: 'Full-stack разработчик. Отвечает за приложение, серверную часть и техническую реализацию цифрового сервиса.',
  },
];

export default function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: '#0A0E1A',
        color: '#fff',
        overflow: 'hidden',
        fontFamily: '"Manrope", Inter, sans-serif',
        '& *': {
          fontFamily: '"Manrope", Inter, sans-serif !important',
        },
      }}
    >
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 20,
          backdropFilter: 'blur(24px)',
          background: 'rgba(10, 14, 26, 0.82)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box component="img" src="/favicon.svg" alt="" sx={{ width: 34, height: 34 }} />
            <Typography variant="subtitle1" fontWeight={800}>SoundBox</Typography>
          </Box>
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
            <Button component={RouterLink} to="/franchise" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              Франшиза
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" startIcon={<Login />} sx={{ borderColor: 'rgba(255,255,255,0.18)' }}>
              Приложение
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          background:
            'radial-gradient(circle at 18% 14%, rgba(124,77,255,0.18), transparent 28%), radial-gradient(circle at 86% 8%, rgba(0,229,255,0.12), transparent 24%), linear-gradient(180deg, #0A0E1A 0%, #101426 45%, #0A0E1A 100%)',
        }}
      >
        <Box
          sx={{
            maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 },
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.02fr 0.98fr' },
            gap: { xs: 5, md: 7 }, alignItems: 'center',
            pt: { xs: 5, md: 7 }, pb: { xs: 6, md: 8 },
          }}
        >
          <Box component={motion.section} initial="hidden" animate="show" variants={fadeUp}>
            <Chip
              label="Кабинки + приложение + франшиза"
              sx={{
                mb: 2.5,
                maxWidth: '100%',
                borderColor: 'rgba(0,229,255,0.28)',
                color: '#9AF4FF',
                background: 'rgba(0,229,255,0.08)',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
              variant="outlined"
            />
            <Typography
              component="h1"
              variant="h2"
              fontWeight={900}
              sx={{ fontSize: { xs: '2.45rem', sm: '3.35rem', md: '4.15rem' }, lineHeight: 0.98, letterSpacing: 0, maxWidth: 760 }}
            >
              SoundBox
            </Typography>
            <Typography variant="h4" component="p" fontWeight={800} sx={{ mt: 1.5, color: '#D4FF68', letterSpacing: 0, fontSize: { xs: '1.45rem', md: '2rem' } }}>
              Тишина как сервис
            </Typography>
            <Typography variant="h5" sx={{ mt: 2.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.48, maxWidth: 700, fontSize: { xs: '1.05rem', md: '1.28rem' } }}>
              Производим звукоизолированные кабинки, подключаем их к приложению бронирования и даем партнерам готовый формат запуска.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={RouterLink} to="/franchise" variant="contained" size="large" startIcon={<Storefront />} endIcon={<ArrowForward />}>
                Купить франшизу
              </Button>
              <Button component={RouterLink} to="/login" variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.18)' }}>
                Открыть приложение
              </Button>
            </Stack>
            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              {metrics.map((metric) => (
                <Box key={metric.label} sx={{ p: 1.75, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#D4FF68' }}>{metric.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{metric.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            component={motion.section}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            sx={{
              minHeight: { xs: 430, sm: 500 },
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: { xs: 430, sm: 520 },
                position: 'relative',
                '& canvas': { display: 'block' },
              }}
            >
              <SoundBoxModel />
            </Box>
            <Box sx={{ position: 'absolute', zIndex: 4, bottom: { xs: 8, sm: 24 }, left: { xs: 4, sm: 18 }, right: { xs: 4, sm: 'auto' }, width: { xs: 'auto', sm: 300 }, p: 2, borderRadius: 3, background: 'rgba(15,20,38,0.88)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
              <Typography variant="caption" color="text.secondary">Готовый формат</Typography>
              <Typography variant="h6" fontWeight={900}>Кабинка + бронирование + доступ</Typography>
              <Typography variant="body2" color="text.secondary">Пользователь выбирает время, бронирует кабинку и получает доступ без лишних действий.</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 32%, rgba(255,255,255,0.025) 68%, transparent 100%)' }}>
          <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 5, md: 6 } }}>
            <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0, mb: 1 }}>
              Почему SoundBox выбирают для современных пространств
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.8, mb: 3 }}>
              SoundBox объединяет физический продукт, цифровой сервис и понятную модель запуска для мест с высоким потоком людей.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {valueCards.map((item) => (
                <Box key={item.title} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(15,20,38,0.72)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <IconButton sx={{ mb: 1.5, color: '#00E5FF', background: 'rgba(0,229,255,0.08)' }}>{item.icon}</IconButton>
                  <Typography variant="h6" fontWeight={900}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 7, md: 9 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.72fr 1.28fr' }, gap: { xs: 3, md: 5 }, alignItems: 'start' }}>
            <Box sx={{ position: { md: 'sticky' }, top: 96 }}>
              <Chip label="Для кого SoundBox" sx={{ mb: 2, color: '#D4FF68', background: 'rgba(212,255,104,0.08)' }} />
              <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0 }}>
                Тихие кабинки работают там, где людям нужен фокус
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
                SoundBox можно поставить в локациях с постоянным потоком людей и превратить свободные метры в полезный платный сервис.
              </Typography>
            </Box>
            <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', background: 'rgba(15,20,38,0.62)' }}>
              {audienceCards.map((item, index) => (
                <Box
                  key={item.title}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '210px 1fr' },
                    gap: { xs: 1.5, sm: 2 },
                    p: { xs: 2, md: 2.5 },
                    borderTop: index === 0 ? 0 : '1px solid rgba(255,255,255,0.08)',
                    background: index % 2 ? 'rgba(255,255,255,0.025)' : 'transparent',
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#0A0E1A', background: index % 2 ? '#00E5FF' : '#D4FF68', flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={900}>{item.title}</Typography>
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                    {[
                      { label: 'Боль', text: item.pain, color: '#FFB4B4' },
                      { label: 'Польза', text: item.benefit, color: '#9AF4FF' },
                      { label: 'Доход', text: item.money, color: '#D4FF68' },
                    ].map((cell) => (
                      <Box key={cell.label}>
                        <Typography variant="caption" sx={{ color: cell.color, fontWeight: 900 }}>{cell.label}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.65 }}>{cell.text}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ background: 'linear-gradient(180deg, transparent 0%, rgba(124,77,255,0.045) 38%, rgba(0,229,255,0.03) 70%, transparent 100%)' }}>
          <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 6, md: 7 } }}>
            <Box sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 5, background: 'linear-gradient(135deg, rgba(124,77,255,0.18), rgba(0,229,255,0.08))', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.75fr 1.25fr' }, gap: { xs: 3, md: 5 }, alignItems: 'center' }}>
                <Box>
                  <Chip label="Как это работает" sx={{ mb: 2, color: '#0A0E1A', background: '#D4FF68', fontWeight: 900 }} />
                  <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0 }}>
                    От свободного места до работающей точки
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
                    Мы делим запуск на понятные этапы: сначала локация и установка, затем подключение к платформе и регулярные бронирования.
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', pl: { xs: 0, sm: 3 } }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', left: 20, top: 18, bottom: 18, width: 2, background: 'linear-gradient(180deg, #D4FF68, #00E5FF)' }} />
                  {workSteps.map((step, index) => (
                    <Box key={step} sx={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 1.5, alignItems: 'center', mb: index === workSteps.length - 1 ? 0 : 2, position: 'relative' }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 900, color: '#0A0E1A', background: index % 2 ? '#00E5FF' : '#D4FF68', border: '4px solid rgba(10,14,26,0.94)', zIndex: 1 }}>
                        {index + 1}
                      </Box>
                      <Typography fontWeight={850} sx={{ p: 1.5, borderRadius: 2, background: 'rgba(10,14,26,0.44)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 7, md: 9 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.84fr 1.16fr' }, gap: { xs: 4, md: 6 }, alignItems: 'start' }}>
            <Box>
            <Chip label="Плюсы для пользователей и владельцев локаций" sx={{ mb: 2, color: '#D4FF68', background: 'rgba(212,255,104,0.08)' }} />
              <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0 }}>
                Что делает SoundBox полезным
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
                SoundBox закрывает повседневную потребность в приватном пространстве и одновременно дает владельцу локации новый сервис, который можно монетизировать без сложной операционной команды.
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {strengths.map((item) => (
                <Box key={item.label} sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#0A0E1A', background: '#D4FF68' }}>{item.icon}</Box>
                    <Typography fontWeight={900}>{item.label}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.7 }}>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 7, md: 9 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' }, gap: { xs: 3, md: 5 }, alignItems: 'stretch' }}>
            <Box sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, background: 'rgba(15,20,38,0.72)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Chip label="Экономика точки" sx={{ mb: 2, color: '#0A0E1A', background: '#D4FF68', fontWeight: 900 }} />
              <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.55rem' }, letterSpacing: 0 }}>
                Доход считается просто: часы загрузки × цена часа
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
                Пример ниже рассчитан по базовой цене 200 ₽ за час. Реальная экономика зависит от локации, потока людей и загрузки кабинок.
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              {economyCases.map((item) => (
                <Box key={item.cabins} sx={{ p: 2.2, borderRadius: 3, background: 'linear-gradient(180deg, rgba(124,77,255,0.16), rgba(255,255,255,0.035))', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" fontWeight={900}>{item.cabins}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.hours}</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ my: 1.25, color: '#D4FF68' }}>{item.revenue}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{item.note}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.026) 34%, rgba(255,255,255,0.018) 76%, transparent 100%)' }}>
          <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 6, md: 7 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.86fr 1.14fr' }, gap: { xs: 3, md: 5 }, alignItems: 'center' }}>
              <Box>
                <Chip label="Почему нам доверять" sx={{ mb: 2, color: '#9AF4FF', background: 'rgba(0,229,255,0.08)' }} />
                <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0 }}>
                  SoundBox — не просто мебель, а управляемый сервис
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
                  Мы объединяем производство, приложение и операционный сценарий, чтобы партнер мог запускать точки по единому стандарту.
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: 1.25 }}>
                {trustPoints.map((point, index) => (
                  <Box key={point} sx={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 1.5, alignItems: 'center', p: 1.75, borderRadius: 2.5, background: 'rgba(15,20,38,0.72)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', background: index % 2 ? '#00E5FF' : '#D4FF68', color: '#0A0E1A' }}>
                      <CheckCircle />
                    </Box>
                    <Typography fontWeight={800}>{point}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 7, md: 9 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.08fr 0.92fr' }, gap: { xs: 4, md: 7 }, alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            {productionSteps.map((step, index) => (
              <Box key={step} sx={{ display: 'grid', gridTemplateColumns: { xs: '42px 1fr', sm: '52px 1fr' }, gap: { xs: 0.75, sm: 1 }, alignItems: 'center', mb: index === productionSteps.length - 1 ? 0 : 2.25, position: 'relative' }}>
                <Typography
                  variant="h2"
                  fontWeight={950}
                  sx={{
                    fontSize: { xs: '4rem', sm: '4.8rem' },
                    lineHeight: 0.9,
                    color: index % 2 ? '#00E5FF' : '#D4FF68',
                    textShadow: index % 2 ? '0 0 24px rgba(0,229,255,0.22)' : '0 0 24px rgba(212,255,104,0.2)',
                  }}
                >
                  {index + 1}
                </Typography>
                <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="caption" sx={{ color: index % 2 ? '#00E5FF' : '#D4FF68', fontWeight: 900 }}>
                    Этап {index + 1}
                  </Typography>
                  <Typography fontWeight={800} sx={{ mt: 0.4 }}>{step}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip label="Собственное производство" sx={{ mb: 2, color: '#9AF4FF', background: 'rgba(0,229,255,0.08)' }} />
            <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0 }}>
              Мы контролируем не только приложение, но и саму кабинку
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8, maxWidth: 560, ml: { md: 'auto' } }}>
              Партнер получает не только приложение, а готовую физическую единицу сервиса: кабину, стандарт качества и подключение к системе бронирования.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 7, md: 9 } }}>
          <Box sx={{ mb: 3 }}>
            <Chip icon={<Workspaces />} label="Команда" sx={{ mb: 2, color: '#D4FF68', background: 'rgba(212,255,104,0.08)' }} />
            <Typography variant="h3" component="h2" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, letterSpacing: 0 }}>
              Команда SoundBox
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 760, lineHeight: 1.8 }}>
              За SoundBox отвечает команда, которая закрывает ключевые направления: стратегию, продукт, производство и продажи.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {teamMembers.map((member, index) => (
              <Box key={member.role} sx={{ p: 2, borderRadius: 3, background: 'rgba(15,20,38,0.72)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ aspectRatio: '1 / 1', borderRadius: 2.5, mb: 1.75, display: 'grid', placeItems: 'center', background: index % 2 ? 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(124,77,255,0.2))' : 'linear-gradient(135deg, rgba(212,255,104,0.16), rgba(0,229,255,0.13))', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={member.photo}
                    alt={member.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={900}>{member.name}</Typography>
                <Chip label={member.role} size="small" sx={{ mt: 1, mb: 1.25, color: '#0A0E1A', background: index % 2 ? '#00E5FF' : '#D4FF68', fontWeight: 800 }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{member.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, pb: { xs: 7, md: 9 } }}>
          <Box sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, background: 'linear-gradient(135deg, rgba(124,77,255,0.22), rgba(0,229,255,0.1))', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="h2" fontWeight={900}>Откройте приложение или оставьте заявку на франшизу</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 690 }}>
                  Посмотрите, как работает бронирование, или узнайте условия запуска SoundBox в своей локации.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <Button component={RouterLink} to="/login" variant="contained" size="large" endIcon={<ArrowForward />}>
                  Открыть приложение
                </Button>
                <Button component={RouterLink} to="/franchise" variant="outlined" size="large" startIcon={<MonetizationOn />} sx={{ borderColor: 'rgba(255,255,255,0.18)' }}>
                  Франшиза
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {mvpFeatures.map((feature) => (
                <Chip key={feature.label} icon={feature.icon} label={feature.label} variant="outlined" sx={{ justifyContent: 'flex-start', py: 2.4, borderColor: 'rgba(255,255,255,0.14)' }} />
              ))}
            </Box>
          </Box>
        </Box>

        <Box component="footer" sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', color: 'text.secondary', background: 'linear-gradient(180deg, rgba(255,255,255,0.035), transparent 42%)' }}>
          <Typography variant="body2">SoundBox: тихие кабинки, цифровая платформа и франшиза</Typography>
          <Stack direction="row" spacing={2}>
            <Button component={RouterLink} to="/franchise" size="small" startIcon={<Handshake />}>Франшиза</Button>
            <Button component={RouterLink} to="/login" size="small">Войти</Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
