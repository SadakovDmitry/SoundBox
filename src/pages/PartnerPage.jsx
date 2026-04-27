import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import PartnerDashboardView from '../components/PartnerDashboardView';

export default function PartnerPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 70% 0%, rgba(0,229,255,0.08), transparent 45%), #0A0E1A',
      px: { xs: 1.5, sm: 2, md: 3 },
      py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          В кабинет
        </Button>

        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Кабинет партнёра</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Общая статистика по сети и детальная аналитика по каждой кабинке.
        </Typography>

        <PartnerDashboardView />
      </Box>
    </Box>
  );
}
