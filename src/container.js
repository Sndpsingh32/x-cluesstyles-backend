import { database } from './database/index.js';
import { createUserRepository } from './repositories/user.repository.js';
import { createUserService } from './services/user.service.js';
import { createUserController } from './controllers/user.controller.js';
import { createAuthService } from './services/auth.service.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createHealthService } from './services/health.service.js';
import { createHealthController } from './controllers/health.controller.js';

// The composition root makes each layer testable and keeps imports decoupled.
export const createContainer = ({ db = database } = {}) => {
  const userRepository = createUserRepository({ db });
  const userService = createUserService({ userRepository });
  const userController = createUserController({ userService });
  const authService = createAuthService({ userRepository });
  const authController = createAuthController({ authService });
  const healthService = createHealthService({ db });
  const healthController = createHealthController({ healthService });
  return Object.freeze({ userRepository, userService, userController, authService, authController, healthService, healthController });
};
