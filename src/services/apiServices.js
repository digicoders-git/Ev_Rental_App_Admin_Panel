import api from './api';

/* ── AUTH ── */
export const adminLogin    = (data) => api.post('/auth/admin/login', data);
export const adminRegister = (data) => api.post('/auth/admin/register', data);
export const franchiseLogin = (data) => api.post('/franchise-enquiry/login', data);
export const sendOtp       = (mobile) => api.post('/auth/send-otp', { mobile });
export const verifyOtp     = (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp });

/* ── PROFILE ── */
export const getProfile     = ()     => api.get('/user/profile');
export const updateProfile  = (data) => api.put('/user/profile', data);
export const changePassword = (data) => api.put('/user/change-password', data);
export const getCreditScore = ()     => api.get('/user/credit-score');

/* ── USERS (Admin) ── */
export const getAllUsers    = ()     => api.get('/user/admin/all');
export const getAllReferrals = ()    => api.get('/user/admin/referrals');
export const getUserById    = (id)   => api.get(`/user/admin/${id}`);
export const addRider       = (data) => api.post('/user/admin/add-rider', data);
export const updateUser     = (id, data) => api.put(`/user/admin/${id}`, data);
export const deleteUser     = (id)   => api.delete(`/user/admin/${id}`);
export const addWalletFunds = (data) => api.post('/wallet/admin/add', data);
export const deductWalletFunds = (data) => api.post('/wallet/admin/deduct', data);
export const getUserWalletHistory = (userId) => api.get(`/wallet/admin/history/${userId}`);

/* ── VEHICLES ── */
export const getAllVehicles      = (params) => api.get('/vehicles', { params });
export const getVehicleById     = (id)   => api.get(`/vehicles/${id}`);
export const createVehicle      = (data) => api.post('/vehicles', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateVehicle      = (id, data) => api.put(`/vehicles/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteVehicle      = (id)   => api.delete(`/vehicles/${id}`);
export const assignVehicle      = (id, franchiseId) => api.put(`/vehicles/${id}/assign`, { franchiseId });
export const checkAvailability  = (id, start_date, end_date) => api.get(`/vehicles/${id}/availability`, { params: { start_date, end_date } });
export const updateVehicleStatus = (id, status, force = false) => api.patch(`/vehicles/${id}/status`, { status, force });


/* ── OFFERS / COUPONS ── */
export const getAllOffers    = ()     => api.get('/offers');
export const createOffer    = (data) => api.post('/offers', data);
export const updateOffer    = (id, data) => api.put(`/offers/${id}`, data);
export const deleteOffer    = (id)   => api.delete(`/offers/${id}`);
export const toggleOffer    = (id)   => api.patch(`/offers/${id}/toggle`);
export const validateCoupon = (data) => api.post('/offers/validate', data);

export const getPublicFranchiseStores = () => api.get('/franchise-enquiry/public/stores');

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
export const uploadStoreAgreement = (id, data) => api.put(`/franchise-enquiry/admin/stores/${id}/agreement`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAllWithdrawalsAdmin = () => api.get('/franchise-enquiry/admin/withdrawals');
export const approveWithdrawalAdmin = (id, data) => api.put(`/franchise-enquiry/admin/withdrawals/${id}/approve`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const rejectWithdrawalAdmin = (id, data) => api.put(`/franchise-enquiry/admin/withdrawals/${id}/reject`, data);
export const releaseFranchiseFundsAdmin = (data) => api.post('/franchise-enquiry/admin/withdrawals/release', data);
export const updateFranchiseWithdrawalStatusAdmin = (id, data) => api.put(`/franchise-enquiry/admin/withdrawals/${id}/status`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadFranchiseAgreementSelf = (data) => api.put('/franchise-enquiry/store/agreement', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getFranchiseRevenue      = (params) => api.get('/franchise-enquiry/revenue', { params });
export const getAdminFranchiseRevenue = (id, params) => api.get(`/franchise-enquiry/admin/revenue/${id}`, { params });
export const getFranchiseHistory      = (id, startDate, endDate) => api.get(`/franchise-enquiry/stores/${id}/history`, { params: { startDate, endDate } });

/* ── FRANCHISE OWNER (Self) ── */
export const getMyFranchiseVehicles   = ()     => api.get('/vehicles/franchise/my');
export const createFranchiseVehicle   = (data) => api.post('/vehicles/franchise/create', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateFranchiseVehicle   = (id, data) => api.put(`/vehicles/franchise/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getFranchiseProfile      = ()     => api.get('/franchise-enquiry/profile');
export const updateFranchiseProfile   = (data) => api.put('/franchise-enquiry/profile', data);
export const changeFranchisePassword  = (data) => api.put('/franchise-enquiry/change-password', data);
export const getFranchiseWallet       = ()     => api.get('/franchise-enquiry/wallet');
export const requestWithdrawal        = (data) => api.post('/franchise-enquiry/wallet/withdraw', data);
export const getFranchiseWithdrawals  = ()     => api.get('/franchise-enquiry/wallet/withdrawals');

/* ── RENTAL PLANS ── */
export const getAllPlans    = (all = false) => api.get('/plans', { params: all ? { all: 'true' } : {} });
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
export const changeBookingVehicle = (id, newVehicleId) => api.put(`/bookings/${id}/change-vehicle`, { newVehicleId });
export const returnVehicle       = (id)     => api.post(`/bookings/${id}/return`);
export const extendBooking = (id, extra_weeks, auto_renew) => api.post(`/bookings/${id}/extend`, { extra_weeks, auto_renew });
export const calculateLateFee    = (id)     => api.get(`/bookings/${id}/calculate-late-fee`);
export const getFranchiseBookings = ()      => api.get('/bookings/franchise/my');
export const approveVehicleSubmission = (id) => api.post(`/bookings/${id}/approve-submission`);
export const rejectVehicleSubmission  = (id) => api.post(`/bookings/${id}/reject-submission`);

/* ── DUE PAYMENTS ── */
export const getMyDues       = ()       => api.get('/bookings/dues/my');
export const getDuesByMobile = (mobile) => api.get('/bookings/admin/dues', { params: { mobile } });
export const payManual       = (id, data) => api.post(`/bookings/${id}/pay-manual`, data);
export const setupInstallments = (id, installments) => api.post(`/bookings/${id}/installments/setup`, { installments });
export const payInstallment    = (id, instId, data) => api.post(`/bookings/${id}/installments/${instId}/pay`, data);
export const addDamageCharge   = (id, data) => api.post(`/bookings/${id}/damage-charge`, data);

/* ── KYC ── */
export const submitKyc      = (data) => api.post('/kyc/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyKycStatus = ()     => api.get('/kyc/my-status');
export const getAllKyc       = ()     => api.get('/kyc/admin/all');
export const trackKycByMobile = (mobile) => api.get(`/kyc/admin/track/${mobile}`);
export const updateKycStatus  = (id, data) => api.put(`/kyc/admin/status/${id}`, data);

// Franchise-scoped KYC (only franchise riders)
export const getFranchiseKyc           = ()           => api.get('/kyc/franchise/my-riders');
export const updateFranchiseKycStatus  = (id, data)   => api.put(`/kyc/franchise/status/${id}`, data);

/* ── TRACKING ── */
export const updateLocation      = (data) => api.post('/tracking/update', data);
export const getLiveLocation     = (id)   => api.get(`/tracking/live/${id}`);
export const getTrackingHistory  = (id, params) => api.get(`/tracking/history/${id}`, { params });
export const getBookingTrip      = (id)   => api.get(`/tracking/booking/${id}`);
export const getFleetTracking    = ()     => api.get('/tracking/franchise/fleet');

/* ── SUPPORT / COMPLAINTS ── */
export const createTicket        = (data) => api.post('/support/ticket', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyTickets        = ()     => api.get('/support/my-tickets');
export const getFranchiseTickets = ()     => api.get('/support/franchise/tickets');
export const updateFranchiseTicket = (id, data) => api.put(`/support/franchise/ticket/${id}`, data);
export const getAllTickets       = ()     => api.get('/support/admin/all');
export const updateTicket        = (id, data) => api.put(`/support/admin/ticket/${id}`, data);

/* ── NOTIFICATIONS ── */
export const getNotifications  = ()   => api.get('/notifications');
export const markRead          = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead       = ()   => api.patch('/notifications/read-all');
export const broadcastNotif    = (data) => api.post('/notifications/broadcast', data);
export const getBroadcastHistory = () => api.get('/notifications/broadcast-history');

/* ── REPORTS ── */
export const getDashboardStats      = ()       => api.get('/reports/dashboard-stats');
export const resetDashboardStats    = (data)   => api.post('/reports/reset-stats', data);
export const getRevenueAnalysis     = (timeframe) => api.get('/reports/revenue-analysis', { params: { timeframe } });
export const getRevenueReport       = (timeframe, startDate, endDate) => api.get('/reports/revenue-report', { params: { timeframe, startDate, endDate } });
export const getFranchisePerformance = ()      => api.get('/reports/franchise-performance');
export const exportBookings         = (timeframe) => api.get('/reports/export/bookings', { params: { timeframe }, responseType: 'blob' });
export const getInstallmentHealth   = ()       => api.get('/reports/installment-health');

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

/* ── INVOICES (RIDER BILLS) ── */
export const getInvoiceByBooking = (bookingId) => api.get(`/invoices/booking/${bookingId}`);
export const getAllInvoices      = (params) => api.get('/invoices', { params });

/* ── SETTLEMENTS (B2B BILLS) ── */
export const getSettlements      = (params) => api.get('/settlements', { params });
export const generateSettlement  = (data)   => api.post('/settlements/generate', data);

/* ── REVIEWS ── */
export const addReview         = (data) => api.post('/reviews', data);
export const getVehicleReviews = (id)   => api.get(`/reviews/vehicle/${id}`);

/* ── VEHICLE CATEGORIES ── */
export const getAllCategories = ()     => api.get('/v-categories');
export const createCategory   = (data) => api.post('/v-categories', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateCategory   = (id, data) => api.put(`/v-categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteCategory   = (id)   => api.delete(`/v-categories/${id}`);

/* ── PLATFORM SETTINGS ── */
export const getPlatformSettings = ()     => api.get('/settings');
export const updatePlatformSettings = (settings) => api.put('/settings', { settings });
export const deleteOldRecords = (months)  => api.delete('/settings/cleanup', { params: { months } });
export const exportDatabaseBackup = ()    => api.get('/settings/backup', { responseType: 'blob' });

/* ── DAMAGE REPORTS ── */
export const getDamageReports = () => api.get('/damage-reports/admin');
export const updateDamageReportStatus = (id, data) => api.patch(`/damage-reports/${id}`, data);
