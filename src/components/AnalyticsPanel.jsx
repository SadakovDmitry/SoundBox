import { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, ButtonGroup, Card, CardContent, IconButton, Skeleton, Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { api } from '../api';

const scaleLabels = {
  year: 'Год',
  month: 'Месяц',
  day: 'День',
};

function shiftCursor(cursor, scale, direction) {
  const next = new Date(cursor);
  if (scale === 'year') next.setFullYear(next.getFullYear() + direction);
  if (scale === 'month') next.setMonth(next.getMonth() + direction);
  if (scale === 'day') next.setDate(next.getDate() + direction);
  return next.toISOString();
}

export default function AnalyticsPanel({ title, mode = 'partner', partnerId, cabinId }) {
  const [scale, setScale] = useState('month');
  const [cursor, setCursor] = useState(() => new Date().toISOString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { scale, cursor, cabin_id: cabinId };
        const result = mode === 'admin'
          ? partnerId
            ? await api.getAdminPartnerAnalytics(partnerId, params)
            : await api.getAdminAnalytics(params)
          : await api.getPartnerAnalytics({ ...params, partner_id: partnerId });
        setData(result);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    queueMicrotask(load);
  }, [cabinId, cursor, mode, partnerId, scale]);

  const maxRevenue = useMemo(() => Math.max(...(data?.series || []).map((item) => item.revenue), 1), [data]);
  const totals = data?.totals || { revenue: 0, bookings: 0, hours: 0 };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {loading ? 'Загрузка периода...' : data?.period_label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <ButtonGroup size="small" variant="outlined">
              {Object.entries(scaleLabels).map(([value, label]) => (
                <Button
                  key={value}
                  variant={scale === value ? 'contained' : 'outlined'}
                  onClick={() => setScale(value)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
            <IconButton onClick={() => setCursor((prev) => shiftCursor(prev, scale, -1))}>
              <ChevronLeft />
            </IconButton>
            <IconButton onClick={() => setCursor((prev) => shiftCursor(prev, scale, 1))}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
          {[
            { label: 'Выручка', value: `${Math.round(totals.revenue)} ₽` },
            { label: 'Брони', value: totals.bookings },
            { label: 'Часы', value: Math.round(totals.hours) },
          ].map((item) => (
            <Box key={item.label} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <Typography variant="h6" fontWeight={800}>{loading ? <Skeleton width={58} /> : item.value}</Typography>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{
          height: 210,
          display: 'flex',
          alignItems: 'flex-end',
          gap: scale === 'year' ? 1.5 : 0.75,
          overflowX: scale === 'year' ? 'hidden' : 'auto',
          pb: 1,
          width: '100%',
        }}>
          {loading ? Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" width={36} height={120} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
          )) : data.series.map((item) => {
            const height = Math.max(8, Math.round((item.revenue / maxRevenue) * 160));
            return (
              <Box
                key={item.key}
                sx={{
                  width: scale === 'year' ? 'auto' : 42,
                  flex: scale === 'year' ? '1 1 0' : '0 0 42px',
                  minWidth: scale === 'year' ? 0 : 42,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ height: 166, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Box
                    title={`${item.label}: ${Math.round(item.revenue)} ₽, ${item.bookings} броней`}
                    sx={{
                      width: scale === 'year' ? 'clamp(22px, 45%, 54px)' : 28,
                      height,
                      borderRadius: '10px 10px 4px 4px',
                      background: item.revenue > 0
                        ? 'linear-gradient(180deg, #D4FF68 0%, #00E5FF 100%)'
                        : 'rgba(255,255,255,0.08)',
                      boxShadow: item.revenue > 0 ? '0 12px 28px rgba(0,229,255,0.18)' : 'none',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
