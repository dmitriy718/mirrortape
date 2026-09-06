CREATE TABLE users (
 id uuid PRIMARY KEY, email text UNIQUE, password_hash text, verified boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(email IS NULL OR length(email)<=254)
);
CREATE TABLE sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiration ON sessions(expires_at);
CREATE TABLE drafts (
 user_id uuid PRIMARY KEY REFERENCES users(id), revision integer NOT NULL DEFAULT 0,
 data jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE watchlist (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),symbol text NOT NULL,
 delete_at timestamptz, undo_hash text, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,symbol), CHECK(symbol ~ '^[A-Z][A-Z0-9.\-]{0,9}$')
);
CREATE INDEX watchlist_pending ON watchlist(delete_at) WHERE delete_at IS NOT NULL;
CREATE TABLE rate_windows (
 key text PRIMARY KEY,hits timestamptz[] NOT NULL DEFAULT '{}',penalty integer NOT NULL DEFAULT 0,
 blocked_until timestamptz,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_windows_cleanup ON rate_windows(updated_at);
CREATE TABLE activity (
 user_id uuid PRIMARY KEY REFERENCES users(id), last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE cohort_reservations (
 user_id uuid PRIMARY KEY REFERENCES users(id), expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE support_cases (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),email text NOT NULL,message text NOT NULL,
 status text NOT NULL DEFAULT 'open',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE auth_tokens (
 token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),purpose text NOT NULL CHECK(purpose IN ('verify','reset')),
 expires_at timestamptz NOT NULL,used_at timestamptz
);
CREATE TABLE email_outbox (
 id uuid PRIMARY KEY,recipient text NOT NULL,subject text NOT NULL,encrypted_body text NOT NULL,
 attempts integer NOT NULL DEFAULT 0,next_attempt timestamptz NOT NULL DEFAULT now(),sent_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_outbox_pending ON email_outbox(next_attempt) WHERE sent_at IS NULL;
CREATE TABLE broker_connections (
 user_id uuid NOT NULL REFERENCES users(id),mode text NOT NULL CHECK(mode IN ('paper','live')),
 encrypted_token text NOT NULL,account_id text NOT NULL,connected_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,mode),UNIQUE(mode,account_id)
);
CREATE TABLE oauth_states (
 state_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),session_hash text NOT NULL,mode text NOT NULL,
 expires_at timestamptz NOT NULL,used_at timestamptz
);
CREATE TABLE billing_customers (
 user_id uuid PRIMARY KEY REFERENCES users(id),customer_id text NOT NULL UNIQUE,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing_subscriptions (
 user_id uuid PRIMARY KEY REFERENCES users(id),subscription_id text NOT NULL UNIQUE,
 status text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE webhook_inbox (
 event_id text PRIMARY KEY,kind text NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),processed_at timestamptz
);
CREATE TABLE audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id uuid REFERENCES users(id),action text NOT NULL,
 detail jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_user_time ON audit_events(user_id,created_at DESC);
