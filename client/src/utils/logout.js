/**
 * logoutUser
 * Calls the backend /api/logout endpoint to remove the session from activeSessions,
 * then clears localStorage and redirects to home.
 */
export const logoutUser = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {
      // Ignore network errors — still clear local state
    }
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
};
