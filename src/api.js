const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  register: (name, email, password) =>
    fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(handleResponse),

  login: (email, password) =>
    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_URL}/me`, { headers: getHeaders() }).then(handleResponse),

  getCabins: () =>
    fetch(`${API_URL}/cabins`, { headers: getHeaders() }).then(handleResponse),

  getCabin: (id) =>
    fetch(`${API_URL}/cabins/${id}`, { headers: getHeaders() }).then(handleResponse),

  getCabinBookings: (id, date) =>
    fetch(`${API_URL}/cabins/${id}/bookings${date ? `?date=${date}` : ''}`, { headers: getHeaders() }).then(handleResponse),

  createBooking: (cabin_id, start_time, end_time) =>
    fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ cabin_id, start_time, end_time }),
    }).then(handleResponse),

  createBulkBooking: (cabin_id, slots) =>
    fetch(`${API_URL}/bookings/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ cabin_id, slots }),
    }).then(handleResponse),

  getMyBookings: () =>
    fetch(`${API_URL}/my-bookings`, { headers: getHeaders() }).then(handleResponse),

  unlockCabin: (bookingId) =>
    fetch(`${API_URL}/bookings/${bookingId}/unlock`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  lockCabin: (bookingId) =>
    fetch(`${API_URL}/bookings/${bookingId}/lock`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  cancelBooking: (bookingId) =>
    fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  reviewBooking: (bookingId, rating, comment) =>
    fetch(`${API_URL}/bookings/${bookingId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating, comment }),
    }).then(handleResponse),

  getWallet: () =>
    fetch(`${API_URL}/wallet`, { headers: getHeaders() }).then(handleResponse),

  topUpWallet: (data) =>
    fetch(`${API_URL}/wallet/top-up`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getNotifications: () =>
    fetch(`${API_URL}/notifications`, { headers: getHeaders() }).then(handleResponse),

  getPartnerSummary: (partnerId) =>
    fetch(`${API_URL}/partner/summary${toQuery({ partner_id: partnerId })}`, { headers: getHeaders() }).then(handleResponse),

  getPartnerAnalytics: (params) =>
    fetch(`${API_URL}/partner/analytics${toQuery(params)}`, { headers: getHeaders() }).then(handleResponse),

  getPartnerCabinReviews: (cabinId, partnerId) =>
    fetch(`${API_URL}/partner/cabins/${cabinId}/reviews${toQuery({ partner_id: partnerId })}`, { headers: getHeaders() }).then(handleResponse),

  getAdminSummary: () =>
    fetch(`${API_URL}/admin/summary`, { headers: getHeaders() }).then(handleResponse),

  getAdminAnalytics: (params) =>
    fetch(`${API_URL}/admin/analytics${toQuery(params)}`, { headers: getHeaders() }).then(handleResponse),

  getAdminFranchiseLeads: () =>
    fetch(`${API_URL}/admin/franchise-leads`, { headers: getHeaders() }).then(handleResponse),

  updateAdminFranchiseLead: (id, data) =>
    fetch(`${API_URL}/admin/franchise-leads/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getAdminBookings: () =>
    fetch(`${API_URL}/admin/bookings`, { headers: getHeaders() }).then(handleResponse),

  getAdminUsers: () =>
    fetch(`${API_URL}/admin/users`, { headers: getHeaders() }).then(handleResponse),

  getAdminCabins: () =>
    fetch(`${API_URL}/admin/cabins`, { headers: getHeaders() }).then(handleResponse),

  getAdminPartners: () =>
    fetch(`${API_URL}/admin/partners`, { headers: getHeaders() }).then(handleResponse),

  getAdminPartnerSummary: (partnerId) =>
    fetch(`${API_URL}/admin/partners/${partnerId}/summary`, { headers: getHeaders() }).then(handleResponse),

  getAdminPartnerAnalytics: (partnerId, params) =>
    fetch(`${API_URL}/admin/partners/${partnerId}/analytics${toQuery(params)}`, { headers: getHeaders() }).then(handleResponse),

  getAdminCabinReviews: (cabinId) =>
    fetch(`${API_URL}/admin/cabins/${cabinId}/reviews`, { headers: getHeaders() }).then(handleResponse),

  updateProfile: (data) =>
    fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  uploadAvatar: (base64) =>
    fetch(`${API_URL}/profile/avatar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ avatar: base64 }),
    }).then(handleResponse),

  submitFranchiseLead: (data) =>
    fetch(`${API_URL}/franchise-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
};
