CREATE TABLE IF NOT EXISTS users (
  id           CHAR(36)      NOT NULL PRIMARY KEY,
  phone        VARCHAR(20)   NOT NULL UNIQUE,
  full_name    VARCHAR(100)  NULL,
  email        VARCHAR(255)  NULL UNIQUE,
  avatar       VARCHAR(2048) NULL,

  -- Delivery / billing address (filled at checkout or profile update)
  address_line VARCHAR(255)  NULL,
  city         VARCHAR(100)  NULL,
  state        VARCHAR(100)  NULL,
  pincode      VARCHAR(10)   NULL,
  country      VARCHAR(100)  NULL DEFAULT 'India',

  role         ENUM('user','admin') NOT NULL DEFAULT 'user',

  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
