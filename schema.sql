-- Besbes Goals database schema
-- Run this file once in phpMyAdmin / MySQL.

CREATE TABLE IF NOT EXISTS goals_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('player','admin','stade_owner') NOT NULL DEFAULT 'player',
  status ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goals_phone (phone),
  UNIQUE KEY uq_goals_email (email),
  KEY idx_goals_role (role),
  KEY idx_goals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'منشور',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_posts_author (author_id),
  KEY idx_posts_created (created_at),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES goals_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals_stadiums (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL DEFAULT '5 ضد 5',
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NULL,
  description TEXT NULL,
  status ENUM('active','hidden') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stadium_owner (owner_id),
  KEY idx_stadium_city (city),
  CONSTRAINT fk_stadium_owner FOREIGN KEY (owner_id) REFERENCES goals_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  stadium_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tickets_sender (sender_id),
  KEY idx_tickets_recipient (recipient_id),
  KEY idx_tickets_status (status),
  CONSTRAINT fk_ticket_sender FOREIGN KEY (sender_id) REFERENCES goals_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_recipient FOREIGN KEY (recipient_id) REFERENCES goals_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_stadium FOREIGN KEY (stadium_id) REFERENCES goals_stadiums(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional first-admin bootstrap:
-- 1) Register your own account normally from the website.
-- 2) Replace YOUR_EMAIL with that account's email and run:
-- UPDATE goals_accounts SET role='admin' WHERE email='YOUR_EMAIL';
