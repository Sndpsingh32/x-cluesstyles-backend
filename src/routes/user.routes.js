import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.js';
import { getCurrentUser, loginUser, registerUser, updateAccountDetails } from '../controllers/user.controller.js';

const router = Router();
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-account').patch(verifyJWT, updateAccountDetails);

export default router;
