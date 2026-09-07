ALTER TABLE sessions ADD COLUMN authenticated boolean NOT NULL DEFAULT false;
UPDATE sessions s SET authenticated=true FROM users u WHERE u.id=s.user_id AND u.email IS NOT NULL;
CREATE TABLE social_identities (
 provider text NOT NULL CHECK(provider IN ('google','apple','facebook')),
 subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 255),
 user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(provider,subject), UNIQUE(user_id,provider)
);
CREATE TABLE social_auth_states (
 state_hash text PRIMARY KEY, provider text NOT NULL CHECK(provider IN ('google','apple','facebook')),
 session_hash text NOT NULL, browser_hash text NOT NULL, nonce text NOT NULL,
 encrypted_verifier text NOT NULL, intent text NOT NULL CHECK(intent IN ('login','link')),
 expires_at timestamptz NOT NULL, used_at timestamptz
);
CREATE INDEX social_auth_states_expiration ON social_auth_states(expires_at);
