-- Create database
CREATE DATABASE IF NOT EXISTS lostandfound_db;
USE lostandfound_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lost items table
CREATE TABLE IF NOT EXISTS lost_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  date_lost DATE,
  image_url VARCHAR(500),
  detected_objects JSON,
  detected_text TEXT,
  dominant_colors JSON,
  status ENUM('active', 'found', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Found items table
CREATE TABLE IF NOT EXISTS found_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  date_found DATE,
  image_url VARCHAR(500),
  detected_objects JSON,
  detected_text TEXT,
  dominant_colors JSON,
  status ENUM('active', 'claimed', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lost_item_id INT NOT NULL,
  found_item_id INT NOT NULL,
  match_score DECIMAL(5,2),
  object_score DECIMAL(5,2),
  text_score DECIMAL(5,2),
  location_score DECIMAL(5,2),
  time_score DECIMAL(5,2),
  status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lost_item_id) REFERENCES lost_items(id) ON DELETE CASCADE,
  FOREIGN KEY (found_item_id) REFERENCES found_items(id) ON DELETE CASCADE
);

-- Admin actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type VARCHAR(100),
  target_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (user1_id, user2_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  match_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_lost_status ON lost_items(status);
CREATE INDEX idx_found_status ON found_items(status);
CREATE INDEX idx_match_score ON matches(match_score DESC);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id, is_read);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id);
CREATE INDEX idx_conversations_users ON conversations(user1_id, user2_id);
