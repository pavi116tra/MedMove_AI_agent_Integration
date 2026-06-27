// Central API base URL — reads from .env.production in production, falls back to localhost in dev
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default API_BASE;
