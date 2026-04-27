import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Collapse, Divider, InputAdornment,
  MenuItem, Skeleton, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import {
  ArrowBack, Assignment, BusinessCenter, EventAvailable, ExpandLess,
  ExpandMore, Group, MeetingRoom, MonetizationOn, Save, Search,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../api';
import AnalyticsPanel from '../components/AnalyticsPanel';
import PartnerDashboardView from '../components/PartnerDashboardView';

const leadStatuses = ['Новая', 'В работе', 'Созвон', 'Партнёр', 'Отказ'];

export default function AdminPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [cabins, setCabins] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showCabins, setShowCabins] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [summaryData, leadsData, bookingsData, usersData, cabinsData, partnersData] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminFranchiseLeads(),
        api.getAdminBookings(),
        api.getAdminUsers(),
        api.getAdminCabins(),
        api.getAdminPartners(),
      ]);
      setSummary(summaryData);
      setLeads(leadsData);
      setBookings(bookingsData);
      setUsers(usersData);
      setCabins(cabinsData);
      setPartners(partnersData);
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

  const filteredPartners = useMemo(() => {
    const query = partnerSearch.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((partner) => (
      partner.name.toLowerCase().includes(query)
      || partner.city?.toLowerCase().includes(query)
      || partner.contact_name?.toLowerCase().includes(query)
    ));
  }, [partnerSearch, partners]);

  return (
    <Box sx={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(124,77,255,0.1), transparent 45%), #0A0E1A',
      px: { xs: 1.5, sm: 2, md: 3 },
      py: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          В кабинет
        </Button>

        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Панель управления</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Общая аналитика, партнёры, заявки, пользователи и кабинки.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 3 }}>
          {[
            { label: 'Пользователи', value: summary?.users, icon: <Group /> },
            { label: 'Партнёры', value: summary?.partners, icon: <BusinessCenter /> },
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
          <CardContent sx={{ py: 1.5 }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab value="overview" label="Обзор" />
              <Tab value="partners" label="Партнёры" />
              <Tab value="operations" label="Операции" />
            </Tabs>
          </CardContent>
        </Card>

        {activeTab === 'overview' && (
          <AnalyticsPanel title="Общая статистика по всем кабинкам" mode="admin" />
        )}

        {activeTab === 'partners' && (
        <>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
              <Typography variant="h6" fontWeight={800}>Партнёры</Typography>
              <TextField
                size="small"
                placeholder="Поиск партнёра"
                value={partnerSearch}
                onChange={(event) => setPartnerSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: 'secondary.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 320 } }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              {filteredPartners.map((partner) => {
                const selected = selectedPartnerId === partner.id;
                return (
                  <Box
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: selected ? '1px solid rgba(124,77,255,0.8)' : '1px solid rgba(255,255,255,0.08)',
                      background: selected ? 'rgba(124,77,255,0.16)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <Typography fontWeight={800}>{partner.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{partner.city} · {partner.contact_name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`${partner.cabin_count} кабинок`} />
                      <Chip size="small" label={`${Math.round(partner.revenue || 0)} ₽`} variant="outlined" />
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {!filteredPartners.length && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Партнёры не найдены.
              </Typography>
            )}
          </CardContent>
        </Card>

        {selectedPartnerId && (
          <Card sx={{ mb: 3, background: 'rgba(255,255,255,0.025)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={800}>
                  Кабинет выбранного партнёра
                </Typography>
                <Button size="small" variant="outlined" onClick={() => setSelectedPartnerId(null)}>
                  Закрыть
                </Button>
              </Box>
              <PartnerDashboardView partnerId={selectedPartnerId} adminMode />
            </CardContent>
          </Card>
        )}
        </>
        )}

        {activeTab === 'operations' && (
        <>
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
              <Button fullWidth endIcon={showCabins ? <ExpandLess /> : <ExpandMore />} onClick={() => setShowCabins(!showCabins)} sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MeetingRoom /> Все кабинки
                </Box>
              </Button>
              <Collapse in={showCabins}>
                {cabins.map((cabin) => (
                  <Box key={cabin.id} sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{cabin.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cabin.partner_name || 'Без партнёра'} · {Math.round(cabin.revenue || 0)} ₽ · рейтинг {Number(cabin.rating || 0).toFixed(1)}
                    </Typography>
                    <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
                  </Box>
                ))}
              </Collapse>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Button fullWidth endIcon={showUsers ? <ExpandLess /> : <ExpandMore />} onClick={() => setShowUsers(!showUsers)} sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group /> Пользователи
                </Box>
              </Button>
              <Collapse in={showUsers}>
                {users.map((user) => (
                  <Box key={user.id} sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email} · баланс {user.balance || 0} ₽</Typography>
                    <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
                  </Box>
                ))}
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Button fullWidth endIcon={showBookings ? <ExpandLess /> : <ExpandMore />} onClick={() => setShowBookings(!showBookings)} sx={{ justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventAvailable /> Последние бронирования
              </Box>
            </Button>
            <Collapse in={showBookings}>
              {bookings.slice(0, 12).map((booking) => (
                <Box key={booking.id} sx={{ py: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{booking.cabin_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking.user_name} · {booking.total_price || 0} ₽ · {booking.status}
                  </Typography>
                  <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
                </Box>
              ))}
            </Collapse>
          </CardContent>
        </Card>
        </>
        )}
      </Box>
    </Box>
  );
}
