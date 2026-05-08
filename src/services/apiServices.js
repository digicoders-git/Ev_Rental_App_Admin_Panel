import api from './api';

/* ── AUTH ── */
export const adminLogin    = (data) => api.post('/auth/admin/login', data);
export const adminRegister = (data) => api.post('/auth/admin/register', data);
export const sendOtp       = (mobile) => api.post('/auth/send-otp', { mobile });
export const verifyOtp     = (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp });

/* ── PROFILE ── */
export const getProfile     = ()     => api.get('/user/profile');
export const updateProfile  = (data) => api.put('/user/profile', data);
export const changePassword = (data) => api.put('/user/change-password', data);
export const getCreditScore = ()     => api.get('/user/credit-score');

/* ── USERS (Admin) ── */
export const getAllUsers    = ()     => api.get('/user/admin/all');
export const getUserById    = (id)   => api.get(`/user/admin/${id}`);
export const addRider       = (data) => api.post('/user/admin/add-rider', data);
export const updateUser     = (id, data) => api.put(`/user/admin/${id}`, data);
export const deleteUser     = (id)   => api.delete(`/user/admin/${id}`);

/* ── VEHICLES ── */
export const getAllVehicles      = (franchiseId) => api.get('/vehicles', { params: franchiseId ? { franchiseId } : {} });
export const getVehicleById     = (id)   => api.get(`/vehicles/${id}`);
export const createVehicle      = (data) => api.post('/vehicles', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateVehicle      = (id, data) => api.put(`/vehicles/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteVehicle      = (id)   => api.delete(`/vehicles/${id}`);
export const assignVehicle      = (id, franchiseId) => api.put(`/vehicles/${id}/assign`, { franchiseId });
export const checkAvailability  = (id, start_date, end_date) => api.get(`/vehicles/${id}/availability`, { params: { start_date, end_date } });

/* ── OFFERS / COUPONS ── */
export const getAllOffers    = ()     => api.get('/offers');
export const createOffer    = (data) => api.post('/offers', data);
export const updateOffer    = (id, data) => api.put(`/offers/${id}`, data);
export const deleteOffer    = (id)   => api.delete(`/offers/${id}`);
export const toggleOffer    = (id)   => api.patch(`/offers/${id}/toggle`);
export const validateCoupon = (data) => api.post('/offers/validate', data);

/* ── FRANCHISE ENQUIRY ── */
export const getFranchiseEnquiries  = (params) => api.get('/franchise-enquiry', { params });
export const submitFranchiseEnquiry = (data)   => api.post('/franchise-enquiry', data);
export const updateEnquiryStatus    = (id, data) => api.patch(`/franchise-enquiry/${id}/status`, data);

/* ── FRANCHISE STORES ── */
export const getAllStores    = ()     => api.get('/franchise-enquiry/stores');
export const getStoreById   = (id)   => api.get(`/franchise-enquiry/stores/${id}`);
export const createStore    = (data) => api.post('/franchise-enquiry/stores', data);
export const updateStore    = (id, data) => api.put(`/franchise-enquiry/stores/${id}`, data);
export const deleteStore    = (id)   => api.delete(`/franchise-enquiry/stores/${id}`);
export const getFranchiseRevenue      = (params) => api.get('/franchise-enquiry/revenue', { params });
export const getAdminFranchiseRevenue = (id, params) => api.get(`/franchise-enquiry/admin/revenue/${id}`, { params });

/* ── RENTAL PLANS ── */
export const getAllPlans    = ()     => api.get('/plans');
export const getPlanById   = (id)   => api.get(`/plans/${id}`);
export const createPlan    = (data) => api.post('/plans', data);
export const updatePlan    = (id, data) => api.put(`/plans/${id}`, data);
export const deletePlan    = (id)   => api.delete(`/plans/${id}`);
export const togglePlan    = (id)   => api.patch(`/plans/${id}/toggle-status`);
export const updatePlanPrice = (id, data) => api.patch(`/plans/${id}/price`, data);

/* ── BOOKINGS ── */
export const getAllBookings      = (params) => api.get('/bookings', { params });
export const getMyBookings       = ()       => api.get('/bookings/my');
export const getBookingById      = (id)     => api.get(`/bookings/${id}`);
export const createBooking       = (data)   => api.post('/bookings', data);
export const updateBookingStatus = (id, data) => api.patch(`/bookings/${id}/status`, data);
export const approveBooking      = (id)     => api.patch(`/bookings/${id}/approve`);
export const rejectBooking       = (id, reason) => api.patch(`/bookings/${id}/reject`, { reason });
export const cancelBooking       = (id, reason) => api.post(`/bookings/${id}/cancel`, { reason });
export const returnVehicle       = (id)     => api.post(`/bookings/${id}/return`);
export const extendBooking       = (id, extra_days) => api.post(`/bookings/${id}/extend`, { extra_days });
export const calculateLateFee    = (id)     => api.get(`/bookings/${id}/calculate-late-fee`);
export const getFranchiseBookings = ()      => api.get('/bookings/franchise/my');

/* ── DUE PAYMENTS ── */
export const getMyDues       = ()       => api.get('/bookings/dues/my');
export const getDuesByMobile = (mobile) => api.get('/bookings/admin/dues', { params: { mobile } });
export const payManual       = (id, data) => api.post(`/bookings/${id}/pay-manual`, data);

/* ── KYC ── */
export const submitKyc      = (data) => api.post('/kyc/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyKycStatus = ()     => api.get('/kyc/my-status');
export const getAllKyc       = ()     => api.get('/kyc/admin/all');
export const trackKycByMobile = (mobile) => api.get(`/kyc/admin/track/${mobile}`);
export const updateKycStatus  = (id, data) => api.put(`/kyc/admin/status/${id}`, data);

/* ── TRACKING ── */
export const updateLocation      = (data) => api.post('/tracking/update', data);
export const getLiveLocation     = (id)   => api.get(`/tracking/live/${id}`);
export const getTrackingHistory  = (id, params) => api.get(`/tracking/history/${id}`, { params });
export const getBookingTrip      = (id)   => api.get(`/tracking/booking/${id}`);
export const getFleetTracking    = ()     => api.get('/tracking/franchise/fleet');

/* ── SUPPORT / COMPLAINTS ── */
export const createTicket    = (data) => api.post('/support/ticket', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyTickets    = ()     => api.get('/support/my-tickets');
export const getAllTickets    = ()     => api.get('/support/admin/all');
export const updateTicket    = (id, data) => api.put(`/support/admin/ticket/${id}`, data);

/* ── NOTIFICATIONS ── */
export const getNotifications  = ()   => api.get('/notifications');
export const markRead          = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead       = ()   => api.patch('/notifications/read-all');
export const broadcastNotif    = (data) => api.post('/notifications/broadcast', data);
export const getBroadcastHistory = () => api.get('/notifications/broadcast-history');

/* ── REPORTS ── */
export const getDashboardStats      = ()       => api.get('/reports/dashboard-stats');
export const getRevenueAnalysis     = (timeframe) => api.get('/reports/revenue-analysis', { params: { timeframe } });
export const getRevenueReport       = (timeframe) => api.get('/reports/revenue-report', { params: { timeframe } });
export const getFranchisePerformance = ()      => api.get('/reports/franchise-performance');
export const exportBookings         = ()       => api.get('/reports/export/bookings', { responseType: 'blob' });

/* ── CONTENT (CMS) ── */
export const getAllContent   = (params) => api.get('/content', { params });
export const getContentBySlug = (slug) => api.get(`/content/${slug}`);
export const createContent   = (data)  => api.post('/content', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateContent   = (id, data) => api.put(`/content/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const toggleContent   = (id)    => api.patch(`/content/${id}/toggle`);
export const deleteContent   = (id)    => api.delete(`/content/${id}`);

/* ── DOCUMENTS ── */
export const getAllDocuments  = ()     => api.get('/documents');
export const createDocument   = (data) => api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateDocument   = (id, data) => api.put(`/documents/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocument   = (id)   => api.delete(`/documents/${id}`);
export const renewDocument    = (id, data) => api.put(`/documents/${id}/renew`, data);

/* ── REVIEWS ── */
export const addReview         = (data) => api.post('/reviews', data);
export const getVehicleReviews = (id)   => api.get(`/reviews/vehicle/${id}`);

/* ── VEHICLE CATEGORIES ── */
export const getAllCategories = ()     => api.get('/v-categories');
export const createCategory   = (data) => api.post('/v-categories', data);
export const updateCategory   = (id, data) => api.put(`/v-categories/${id}`, data);
export const deleteCategory   = (id)   => api.delete(`/v-categories/${id}`);

/* ── PLATFORM SETTINGS ── */
export const getPlatformSettings = ()     => api.get('/settings');
export const updatePlatformSettings = (settings) => api.put('/settings', { settings });
