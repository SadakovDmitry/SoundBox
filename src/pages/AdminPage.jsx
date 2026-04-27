import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Divider, MenuItem, Skeleton,
  TextField, Typography,
} from '@mui/material';
import {
  ArrowBack, Assignment, EventAvailable, Group, MonetizationOn,
  Save,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api';

const leadStatuses = ['Новая', 'В работе', 'Созвон', 'Партнёр', 'Отказ'];

export default function AdminPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [summaryData, leadsData, bookingsData, usersData] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminFranchiseLeads(),
        api.getAdminBookings(),
        api.getAdminUsers(),
      ]);
      setSummary(summaryData);
      setLeads(leadsData);
      setBookings(bookingsData);
      setUsers(usersData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(loadData);
  }, []);

  const updateLead = async (lead) => {
    try {
      const updated = await api.updateAdminFranchiseLead(lead.id, {
        status: lead.status,
        manager_note: lead.manager_note,
      });
      setLeads((prev) => prev.map((item) => (item.id === lead.id ? updated : item)));
      toast.success('Заявка обновлена');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateLeadLocal = (id, patch) => {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  };

  return (
    <Box sx={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(124,77,255,0.1), transparent 45%), #0A0E1A',
      px: { xs: 1.5, sm: 2, md: 3 },
      py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          В кабинет
        </Button>

        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Панель управления</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Заявки на франшизу, пользователи и бронирования в одном месте.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {[
            { label: 'Пользователи', value: summary?.users, icon: <Group /> },
            { label: 'Брони', value: summary?.bookings, icon: <EventAvailable /> },
            { label: 'Выручка', value: `${summary?.revenue || 0} ₽`, icon: <MonetizationOn /> },
            { label: 'Заявки', value: summary?.leads, icon: <Assignment /> },
          ].map((item) => (
            <Card key={item.label} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <CardContent>
                <Box sx={{ color: 'secondary.main', mb: 1 }}>{item.icon}</Box>
                <Typography variant="h5" fontWeight={800}>{loading ? <Skeleton width={52} /> : item.value}</Typography>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Заявки на франшизу</Typography>
            {leads.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Заявок пока нет.</Typography>
            ) : leads.map((lead) => (
              <Box key={lead.id} sx={{ py: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                  <Box>
                    <Typography fontWeight={700}>{lead.name} · {lead.city}</Typography>
                    <Typography variant="caption" color="text.secondary">{lead.phone} {lead.email ? `· ${lead.email}` : ''}</Typography>
                  </Box>
                  <Chip label={lead.format} size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '180px 1fr auto' }, gap: 1 }}>
                  <TextField select size="small" label="Статус" value={lead.status || 'Новая'}
                    onChange={(e) => updateLeadLocal(lead.id, { status: e.target.value })}>
                    {leadStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Комментарий" value={lead.manager_note || ''}
                    onChange={(e) => updateLeadLocal(lead.id, { manager_note: e.target.value })} />
                  <Button variant="contained" startIcon={<Save />} onClick={() => updateLead(lead)}>
                    Сохранить
                  </Button>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Последние бронирования</Typography>
              {bookings.slice(0, 10).map((booking) => (
                <Box key={booking.id} sx={{ py: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{booking.cabin_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking.user_name} · {booking.total_price || 0} ₽ · {booking.status}
                  </Typography>
                  <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Пользователи</Typography>
              {users.slice(0, 10).map((user) => (
                <Box key={user.id} sx={{ py: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email} · баланс {user.balance || 0} ₽</Typography>
                  <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
