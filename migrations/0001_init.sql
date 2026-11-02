CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  nickname TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE cats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_key TEXT,
  description TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pose_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE stickers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cat_id TEXT,
  category_id TEXT,
  title TEXT,
  original_key TEXT,
  cutout_key TEXT,
  sticker_key TEXT,
  thumbnail_key TEXT,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (cat_id) REFERENCES cats(id),
  FOREIGN KEY (category_id) REFERENCES pose_categories(id)
);

CREATE TABLE processing_jobs (
  id TEXT PRIMARY KEY,
  sticker_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  finished_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (sticker_id) REFERENCES stickers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_stickers_user ON stickers(user_id, created_at DESC);
CREATE INDEX idx_jobs_sticker ON processing_jobs(sticker_id);
