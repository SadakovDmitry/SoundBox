import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Tab, Tabs, Alert, IconButton, InputAdornment,
} from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff, VolumeOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const pseudoRandom = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

function ParticleBackground() {
  const isMobile = window.innerWidth < 600;
  const particles = Array.from({ length: isMobile ? 20 : 50 }, (_, i) => ({
    id: i,
    x: pseudoRandom(i + 1) * 100,
    y: pseudoRandom(i + 11) * 100,
    size: pseudoRandom(i + 21) * 4 + 1,
    duration: pseudoRandom(i + 31) * 20 + 10,
    delay: pseudoRandom(i + 41) * 5,
  }));

  return (
    <Box sx={{
      position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0,
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,77,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,229,255,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(101,31,255,0.1) 0%, transparent 50%), #0A0E1A',
    }}>
      {particles.map((p) => (
        <Box
          key={p.id}
          component={motion.div}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.id % 3 === 0
              ? 'rgba(124, 77, 255, 0.6)'
              : p.id % 3 === 1
                ? 'rgba(0, 229, 255, 0.5)'
                : 'rgba(255, 255, 255, 0.3)',
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </Box>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (tab === 1 && !name.trim()) {
      setError('Введите ваше имя');
      return;
    }
    if (password.length < 4) {
      setError('Пароль должен содержать минимум 4 символа');
      return;
    }

    setLoading(true);
    try {
      if (tab === 0) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', px: { xs: 1.5, sm: 2 }, py: { xs: 2, sm: 0 } }}>
      <ParticleBackground />
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBack />}
        sx={{
          position: 'fixed',
          top: { xs: 12, sm: 18 },
          left: { xs: 12, sm: 18 },
          zIndex: 2,
          color: 'text.secondary',
          background: 'rgba(15, 20, 38, 0.55)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(18px)',
          '&:hover': { background: 'rgba(15, 20, 38, 0.82)' },
        }}
      >
        Лендинг
      </Button>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        sx={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: { xs: '100%', sm: 440 }, mx: { xs: 0, sm: 2 },
          background: 'rgba(15, 20, 38, 0.7)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(124, 77, 255, 0.2)',
          borderRadius: { xs: 3, sm: 4 }, p: { xs: 2.5, sm: 4 },
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 4 } }}>
          <Box
            component={motion.div}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            sx={{ display: 'inline-flex', p: 2, borderRadius: 3, mb: 2, background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(0,229,255,0.2))' }}
          >
            <VolumeOff sx={{ fontSize: { xs: 32, sm: 40 }, color: 'secondary.main' }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' }, background: 'linear-gradient(135deg, #B388FF, #00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SoundBox
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Звукоизолированные кабинки по Москве
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setError(''); }}
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTab-root': { borderRadius: 2, fontWeight: 600 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #7C4DFF, #00E5FF)' },
          }}
        >
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {tab === 1 && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TextField
                  fullWidth label="Имя" placeholder="Иван Петров"
                  value={name} onChange={(e) => setName(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <TextField
            fullWidth label="Email" type="email" placeholder="ivan@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth label="Пароль" placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            sx={{ py: 1.5, fontSize: '1rem' }}
          >
            {loading ? '...' : tab === 0 ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
