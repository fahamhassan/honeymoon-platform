const express = require('express');

// ── Auth Router ───────────────────────────────────────────────────────────────
const router = express.Router();
const auth   = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register',             auth.register);
router.post('/login',                auth.login);
router.post('/admin/login',          auth.adminLogin);
router.post('/vendor/register',      auth.vendorRegister);
router.post('/vendor/login',         auth.vendorLogin);
router.post('/otp/send',             auth.sendOtp);
router.post('/otp/verify',           auth.verifyOtp);
router.post('/forgot-password',      auth.forgotPassword);
router.post('/reset-password',       auth.resetPassword);
router.get ('/uaepass/url',          auth.uaepassUrl);
router.get ('/uaepass/callback',     auth.uaepassCallback);   // web redirect from UAE Pass
router.post('/uaepass/mobile',       auth.uaepassMobile);     // called by React Native app
router.post('/refresh',              auth.refresh);
router.post('/logout',               auth.logout);
router.post('/logout-all',           authenticate, auth.logoutAll);
router.get ('/me',                   authenticate, auth.me);

module.exports = router;

// ── Vendor Router ─────────────────────────────────────────────────────────────
const vendorRouter = express.Router();
const vCtrl = require('../controllers/vendorController');
const { authenticate: auth2, requireVendor } = require('../middleware/auth');

vendorRouter.get ('/',                auth2, vCtrl.listVendors); // auth optional for wishlisted check
vendorRouter.get ('/featured',        vCtrl.getFeatured);
vendorRouter.get ('/:id',             vCtrl.getVendor);
vendorRouter.get ('/:vendor_id/reviews', require('../controllers/userController').getVendorReviews);

vendorRouter.put ('/profile',           auth2, requireVendor, vCtrl.updateProfile);
vendorRouter.get ('/me/services',       auth2, requireVendor, vCtrl.getServices);
vendorRouter.post('/me/services',       auth2, requireVendor, vCtrl.createService);
vendorRouter.put ('/me/services/:id',   auth2, requireVendor, vCtrl.updateService);
vendorRouter.delete('/me/services/:id', auth2, requireVendor, vCtrl.deleteService);
vendorRouter.get ('/me/stats',          auth2, requireVendor, vCtrl.getStats);
vendorRouter.get ('/me/bookings',       auth2, requireVendor, require('../controllers/bookingController').getVendorBookings);
vendorRouter.patch('/me/bookings/:id',  auth2, requireVendor, require('../controllers/bookingController').updateBookingStatus);

module.exports.vendorRouter = vendorRouter;

// ── Booking Router ────────────────────────────────────────────────────────────
const bookingRouter = express.Router();
const bCtrl = require('../controllers/bookingController');
const { authenticate: auth3, requireUser } = require('../middleware/auth');

bookingRouter.post('/',            auth3, requireUser, bCtrl.createBooking);
bookingRouter.get ('/',            auth3, requireUser, bCtrl.getMyBookings);
bookingRouter.get ('/:id',         auth3, bCtrl.getBooking);
bookingRouter.post('/:id/cancel',  auth3, requireUser, bCtrl.cancelBooking);

module.exports.bookingRouter = bookingRouter;

// ── Payment Router ────────────────────────────────────────────────────────────
const paymentRouter = express.Router();
const pCtrl = require('../controllers/paymentController');
const { authenticate: auth4, requireUser: reqUser } = require('../middleware/auth');

paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), pCtrl.stripeWebhook);
paymentRouter.post('/sheet',   auth4, reqUser, pCtrl.createPaymentSheet);  // PaymentSheet (React Native SDK)
paymentRouter.post('/intent',  auth4, reqUser, pCtrl.createPaymentSheet);  // alias kept for compatibility
paymentRouter.get ('/',        auth4, pCtrl.getPayments);
paymentRouter.post('/refund',  auth4, reqUser, pCtrl.requestRefund);

module.exports.paymentRouter = paymentRouter;

// ── User Router ───────────────────────────────────────────────────────────────
const userRouter = express.Router();
const uCtrl = require('../controllers/userController');
const { authenticate: auth5, requireUser: reqUser2, requireVendor: reqVendor } = require('../middleware/auth');

userRouter.get   ('/profile',              auth5, reqUser2,  uCtrl.getProfile);
userRouter.put   ('/profile',              auth5, reqUser2,  uCtrl.updateProfile);
userRouter.post  ('/change-password',      auth5, reqUser2,  uCtrl.changePassword);
userRouter.get   ('/loyalty',              auth5, reqUser2,  uCtrl.getLoyalty);
userRouter.get   ('/events',               auth5, reqUser2,  uCtrl.getEvents);
userRouter.post  ('/events',               auth5, reqUser2,  uCtrl.createEvent);
userRouter.put   ('/events/:id',           auth5, reqUser2,  uCtrl.updateEvent);
userRouter.get   ('/wishlist',             auth5, reqUser2,  uCtrl.getWishlist);
userRouter.post  ('/wishlist/toggle',      auth5, reqUser2,  uCtrl.toggleWishlist);
userRouter.post  ('/reviews',              auth5, reqUser2,  uCtrl.createReview);
userRouter.patch ('/reviews/:id/reply',    auth5, reqVendor, uCtrl.replyToReview);
userRouter.get   ('/notifications',        auth5,            uCtrl.getNotifications);
userRouter.patch ('/notifications/:id',    auth5,            uCtrl.markRead);
userRouter.post  ('/push-token',           auth5,            uCtrl.updatePushToken);

module.exports.userRouter = userRouter;

// ── Admin Router ──────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const aCtrl = require('../controllers/adminController');
const { authenticate: auth6, requireAdmin } = require('../middleware/auth');
const A = [auth6, requireAdmin];

adminRouter.get   ('/dashboard',                  ...A, aCtrl.getDashboard);
adminRouter.get   ('/users',                      ...A, aCtrl.getUsers);
adminRouter.patch ('/users/:id/status',           ...A, aCtrl.updateUserStatus);
adminRouter.get   ('/vendors',                    ...A, aCtrl.getVendors);
adminRouter.post  ('/vendors/:id/approve',        ...A, aCtrl.approveVendor);
adminRouter.post  ('/vendors/:id/reject',         ...A, aCtrl.rejectVendor);
adminRouter.post  ('/vendors/:id/suspend',        ...A, aCtrl.suspendVendor);
adminRouter.get   ('/bookings',                   ...A, aCtrl.getAllBookings);
adminRouter.get   ('/finance',                    ...A, aCtrl.getFinancials);
adminRouter.get   ('/reports',                    ...A, aCtrl.getReports);
adminRouter.patch ('/reports/:id',                ...A, aCtrl.updateReport);
adminRouter.get   ('/content/banners',            ...A, aCtrl.getBanners);
adminRouter.post  ('/content/banners',            ...A, aCtrl.createBanner);
adminRouter.patch ('/content/banners/:id/toggle', ...A, aCtrl.toggleBanner);
adminRouter.delete('/content/banners/:id',        ...A, aCtrl.deleteBanner);
adminRouter.get   ('/content/featured',           ...A, aCtrl.getFeatured);
adminRouter.post  ('/content/featured',           ...A, aCtrl.addFeatured);
adminRouter.delete('/content/featured/:vendorId', ...A, aCtrl.removeFeatured);
adminRouter.get   ('/content/promotions',         ...A, aCtrl.getPromotions);
adminRouter.post  ('/content/promotions',         ...A, aCtrl.createPromotion);
adminRouter.post  ('/notifications/send',         ...A, aCtrl.sendNotification);

module.exports.adminRouter = adminRouter;
