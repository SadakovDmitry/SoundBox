import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Collapse, Dialog, DialogContent,
  DialogTitle, LinearProgress, Rating, Skeleton, Typography,
} from '@mui/material';
import {
  BusinessCenter, EventAvailable, MonetizationOn, Reviews, Star, Timelapse,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api';
import AnalyticsPanel from './AnalyticsPanel';

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

export default function PartnerDashboardView({ partnerId, adminMode = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCabinId, setExpandedCabinId] = useState(null);
  const [reviewsCabin, setReviewsCabin] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = adminMode && partnerId
        ? await api.getAdminPartnerSummary(partnerId)
        : await api.getPartnerSummary(partnerId);
      setData(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminMode, partnerId]);

  useEffect(() => {
    queueMicrotask(loadData);
  }, [loadData]);

  const openReviews = async (cabin) => {
    setReviewsCabin(cabin);
    setReviewsLoading(true);
    try {
      setReviews(adminMode ? await api.getAdminCabinReviews(cabin.id) : await api.getPartnerCabinReviews(cabin.id, partnerId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  const totals = data?.totals || { revenue: 0, bookings: 0, hours: 0 };
  const maxHours = Math.max(...(data?.cabins || []).map((cabin) => Number(cabin.hours || 0)), 1);

  return (
    <Box>
      {data?.partner && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>{data.partner.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {data.partner.city} · {data.partner.contact_name} · {data.partner.phone}
          </Typography>
        </Box>
      )}

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

      <AnalyticsPanel
        title={adminMode ? 'Статистика партнёра по всем кабинкам' : 'Статистика по всем кабинкам'}
        mode={adminMode ? 'admin' : 'partner'}
        partnerId={partnerId}
      />

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <BusinessCenter sx={{ color: 'secondary.main' }} />
            Кабинки
          </Typography>
          {(data?.cabins || []).map((cabin) => {
            const hours = Number(cabin.hours || 0);
            const progress = Math.min(100, Math.round((hours / maxHours) * 100));
            const expanded = expandedCabinId === cabin.id;
            return (
              <Box key={cabin.id} sx={{ py: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1.5, alignItems: 'start', mb: 1 }}>
                  <Box>
                    <Typography fontWeight={800}>{cabin.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{cabin.address}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                      <Chip size="small" color={statusColor(cabin.status)} label={statusLabel(cabin.status)} />
                      <Chip size="small" icon={<Star sx={{ fontSize: 15 }} />} label={`${Number(cabin.rating || 0).toFixed(1)} · ${cabin.review_count || 0} отзывов`} variant="outlined" />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Button size="small" variant="outlined" onClick={() => setExpandedCabinId(expanded ? null : cabin.id)}>
                      {expanded ? 'Скрыть статистику' : 'Статистика'}
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<Reviews />} onClick={() => openReviews(cabin)}>
                      Отзывы
                    </Button>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 8, borderRadius: 999, mb: 1, background: 'rgba(255,255,255,0.08)' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">{Math.round(hours)} ч загрузки</Typography>
                  <Typography variant="caption" color="text.secondary">{cabin.booking_count} броней · {Math.round(cabin.revenue || 0)} ₽</Typography>
                </Box>
                <Collapse in={expanded}>
                  <Box sx={{ mt: 2 }}>
                    <AnalyticsPanel
                      title={`Статистика: ${cabin.name}`}
                      mode={adminMode ? 'admin' : 'partner'}
                      partnerId={partnerId}
                      cabinId={cabin.id}
                    />
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={Boolean(reviewsCabin)} onClose={() => setReviewsCabin(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={800}>Отзывы: {reviewsCabin?.name}</Typography>
        </DialogTitle>
        <DialogContent>
          {reviewsLoading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
          ) : reviews.length ? reviews.map((review) => (
            <Box key={review.id} sx={{ py: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography fontWeight={700}>{review.user_name}</Typography>
                <Rating value={review.rating} size="small" readOnly />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {review.comment || 'Без комментария'}
              </Typography>
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary">Отзывов пока нет.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
