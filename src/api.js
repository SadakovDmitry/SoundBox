const API_URL = 'http://localhost:3001/api';

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

  getMyBookings: () =>
    fetch(`${API_URL}/my-bookings`, { headers: getHeaders() }).then(handleResponse),

  unlockCabin: (bookingId) =>
    fetch(`${API_URL}/bookings/${bookingId}/unlock`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  cancelBooking: (bookingId) =>
    fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),
};
