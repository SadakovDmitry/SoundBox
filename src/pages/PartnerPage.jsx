import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, LinearProgress, Skeleton, Typography,
} from '@mui/material';
import {
  ArrowBack, BusinessCenter, EventAvailable, MonetizationOn, Timelapse,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api';

function statusLabel(status) {
  if (status === 'occupied') return 'Занята';
  if (status === 'soon') return 'Скоро бронь';
  return 'Свободна';
}

function statusColor(status) {
  if (status === 'occupied') return 'error';
  if (status === 'soon') return 'warning';
  return 'success';
}

export default function PartnerPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setData(await api.getPartnerSummary());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(loadData);
  }, []);

  const totals = data?.totals || { revenue: 0, bookings: 0, hours: 0 };
  const maxHours = Math.max(...(data?.cabins || []).map((cabin) => Number(cabin.hours || 0)), 1);

  return (
    <Box sx={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 70% 0%, rgba(0,229,255,0.08), transparent 45%), #0A0E1A',
      px: { xs: 1.5, sm: 2, md: 3 },
      py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          В кабинет
        </Button>

        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Кабинет партнёра</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Показатели сети: выручка, бронирования, загрузка и статусы кабинок.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 3 }}>
          {[
            { label: 'Выручка', value: `${Math.round(totals.revenue)} ₽`, icon: <MonetizationOn /> },
            { label: 'Брони', value: totals.bookings, icon: <EventAvailable /> },
            { label: 'Часы работы', value: Math.round(totals.hours), icon: <Timelapse /> },
          ].map((item) => (
            <Card key={item.label} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <CardContent>
                <Box sx={{ color: 'secondary.main', mb: 1 }}>{item.icon}</Box>
                <Typography variant="h5" fontWeight={800}>{loading ? <Skeleton width={56} /> : item.value}</Typography>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <BusinessCenter sx={{ color: 'secondary.main' }} />
              Кабинки
            </Typography>
            {(data?.cabins || []).map((cabin) => {
              const hours = Number(cabin.hours || 0);
              const progress = Math.min(100, Math.round((hours / maxHours) * 100));
              return (
                <Box key={cabin.id} sx={{ py: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography fontWeight={700}>{cabin.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{cabin.address}</Typography>
                    </Box>
                    <Chip size="small" color={statusColor(cabin.status)} label={statusLabel(cabin.status)} />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 999, mb: 1, background: 'rgba(255,255,255,0.08)' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">{Math.round(hours)} ч загрузки</Typography>
                    <Typography variant="caption" color="text.secondary">{cabin.booking_count} броней · {Math.round(cabin.revenue || 0)} ₽</Typography>
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
