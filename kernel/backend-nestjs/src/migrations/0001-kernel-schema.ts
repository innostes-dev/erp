// GENERATED from docs/backend-parity/schema.sql (the reference Alembic schema). Do not edit by hand.
// Regenerate: node scripts/gen-schema.js
export const KERNEL_SCHEMA_SQL = `-- Reference kernel schema (generated from Alembic by scripts/parity/gen_schema.py).
-- Source of truth for Laravel and NestJS migrations.

CREATE TABLE tenants (
    id UUID NOT NULL, 
    name VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_tenants PRIMARY KEY (id)
);

CREATE INDEX ix_tenants_deleted_at ON tenants (deleted_at);

ALTER TABLE tenants ADD COLUMN slug VARCHAR(63);

ALTER TABLE tenants ALTER COLUMN slug SET NOT NULL;

ALTER TABLE tenants ADD CONSTRAINT uq_tenants_slug UNIQUE (slug);

ALTER TABLE tenants ADD COLUMN country VARCHAR(2);

ALTER TABLE tenants ADD COLUMN timezone VARCHAR(64);

ALTER TABLE tenants ADD COLUMN language VARCHAR(16);

ALTER TABLE tenants ADD COLUMN date_format VARCHAR(20);

CREATE TABLE installation (
    id UUID NOT NULL, 
    singleton BOOLEAN DEFAULT true NOT NULL, 
    app_version VARCHAR(50) NOT NULL, 
    default_tenant_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_installation PRIMARY KEY (id), 
    CONSTRAINT ck_installation_singleton_true CHECK (singleton), 
    CONSTRAINT fk_installation_default_tenant_id_tenants FOREIGN KEY(default_tenant_id) REFERENCES tenants (id), 
    CONSTRAINT uq_installation_singleton UNIQUE (singleton)
);

CREATE INDEX ix_installation_deleted_at ON installation (deleted_at);

CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

CREATE TYPE device_type_enum AS ENUM ('desktop', 'mobile', 'tablet', 'scanner', 'kiosk');

CREATE TYPE device_status_enum AS ENUM ('active', 'pending_approval', 'blocked', 'wiped');

CREATE TYPE tenant_member_status_enum AS ENUM ('active', 'invited', 'suspended');

CREATE TABLE users (
    id UUID NOT NULL, 
    first_name VARCHAR(100) NOT NULL, 
    last_name VARCHAR(100), 
    email_hash VARCHAR(64) NOT NULL, 
    email_encrypted TEXT NOT NULL, 
    mobile_hash VARCHAR(64), 
    mobile_encrypted TEXT, 
    password_hash VARCHAR(255) NOT NULL, 
    status user_status_enum DEFAULT 'active' NOT NULL, 
    is_super_admin BOOLEAN DEFAULT false NOT NULL, 
    must_change_password BOOLEAN DEFAULT false NOT NULL, 
    temp_password_expires_at TIMESTAMP WITH TIME ZONE, 
    token_version INTEGER DEFAULT '1' NOT NULL, 
    failed_login_attempts INTEGER DEFAULT '0' NOT NULL, 
    blocked_until TIMESTAMP WITH TIME ZONE, 
    key_version INTEGER DEFAULT '1' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_users PRIMARY KEY (id), 
    CONSTRAINT uq_users_email_hash UNIQUE (email_hash), 
    CONSTRAINT uq_users_mobile_hash UNIQUE (mobile_hash)
);

CREATE UNIQUE INDEX ix_users_email_hash ON users (email_hash);

CREATE UNIQUE INDEX ix_users_mobile_hash ON users (mobile_hash);

CREATE INDEX ix_users_status ON users (status);

CREATE INDEX ix_users_deleted_at ON users (deleted_at);

CREATE TABLE user_profiles (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    preferred_language VARCHAR(16) DEFAULT 'en-US' NOT NULL, 
    timezone VARCHAR(64) DEFAULT 'UTC' NOT NULL, 
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD' NOT NULL, 
    time_format VARCHAR(10) DEFAULT '24h' NOT NULL, 
    avatar_url VARCHAR(512), 
    bio TEXT, 
    ui_preferences JSONB DEFAULT '{}'::jsonb NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_profiles PRIMARY KEY (id), 
    CONSTRAINT fk_user_profiles_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id)
);

CREATE UNIQUE INDEX ix_user_profiles_user_id ON user_profiles (user_id);

CREATE INDEX ix_user_profiles_deleted_at ON user_profiles (deleted_at);

CREATE TABLE user_security (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    email_verified_at TIMESTAMP WITH TIME ZONE, 
    mobile_verified_at TIMESTAMP WITH TIME ZONE, 
    password_changed_at TIMESTAMP WITH TIME ZONE, 
    mfa_enabled BOOLEAN DEFAULT false NOT NULL, 
    mfa_secret_encrypted TEXT, 
    mfa_backup_codes_hash JSONB, 
    last_login_at TIMESTAMP WITH TIME ZONE, 
    last_login_ip VARCHAR(45), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_security PRIMARY KEY (id), 
    CONSTRAINT fk_user_security_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_user_security_user_id UNIQUE (user_id)
);

CREATE UNIQUE INDEX ix_user_security_user_id ON user_security (user_id);

CREATE INDEX ix_user_security_deleted_at ON user_security (deleted_at);

CREATE TABLE password_histories (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_password_histories PRIMARY KEY (id), 
    CONSTRAINT fk_password_histories_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_password_histories_user_id ON password_histories (user_id);

CREATE INDEX ix_password_histories_deleted_at ON password_histories (deleted_at);

CREATE TABLE user_devices (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    device_fingerprint VARCHAR(128) NOT NULL, 
    device_name VARCHAR(255) NOT NULL, 
    device_type device_type_enum DEFAULT 'desktop' NOT NULL, 
    os_name VARCHAR(64), 
    os_version VARCHAR(32), 
    client_name VARCHAR(64), 
    client_version VARCHAR(32), 
    push_token TEXT, 
    is_trusted BOOLEAN DEFAULT false NOT NULL, 
    is_corporate_managed BOOLEAN DEFAULT false NOT NULL, 
    status device_status_enum DEFAULT 'active' NOT NULL, 
    wipe_requested_at TIMESTAMP WITH TIME ZONE, 
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    last_ip VARCHAR(45), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_devices PRIMARY KEY (id), 
    CONSTRAINT fk_user_devices_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_user_devices_user_id ON user_devices (user_id);

CREATE INDEX ix_user_devices_device_fingerprint ON user_devices (device_fingerprint);

CREATE INDEX ix_user_devices_status ON user_devices (status);

CREATE INDEX ix_user_devices_deleted_at ON user_devices (deleted_at);

CREATE TABLE user_sessions (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    device_id UUID, 
    refresh_token_hash VARCHAR(64) NOT NULL, 
    ip_address VARCHAR(45), 
    user_agent TEXT, 
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    revoked_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_sessions PRIMARY KEY (id), 
    CONSTRAINT fk_user_sessions_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT fk_user_sessions_device_id_user_devices FOREIGN KEY(device_id) REFERENCES user_devices (id) ON DELETE SET NULL, 
    CONSTRAINT uq_user_sessions_refresh_token_hash UNIQUE (refresh_token_hash)
);

CREATE INDEX ix_user_sessions_user_id ON user_sessions (user_id);

CREATE INDEX ix_user_sessions_device_id ON user_sessions (device_id);

CREATE UNIQUE INDEX ix_user_sessions_refresh_token_hash ON user_sessions (refresh_token_hash);

CREATE INDEX ix_user_sessions_deleted_at ON user_sessions (deleted_at);

CREATE TABLE permissions (
    id UUID NOT NULL, 
    code VARCHAR(100) NOT NULL, 
    module VARCHAR(50) NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    description TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_permissions PRIMARY KEY (id), 
    CONSTRAINT uq_permissions_code UNIQUE (code)
);

CREATE UNIQUE INDEX ix_permissions_code ON permissions (code);

CREATE INDEX ix_permissions_module ON permissions (module);

CREATE INDEX ix_permissions_deleted_at ON permissions (deleted_at);

CREATE TABLE roles (
    id UUID NOT NULL, 
    tenant_id UUID, 
    code VARCHAR(50) NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    description TEXT, 
    is_system BOOLEAN DEFAULT false NOT NULL, 
    hierarchy_level INTEGER DEFAULT '0' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_roles PRIMARY KEY (id), 
    CONSTRAINT fk_roles_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX ix_roles_tenant_id ON roles (tenant_id);

CREATE INDEX ix_roles_code ON roles (code);

CREATE INDEX ix_roles_deleted_at ON roles (deleted_at);

CREATE TABLE role_permissions (
    id UUID NOT NULL, 
    role_id UUID NOT NULL, 
    permission_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_role_permissions PRIMARY KEY (id), 
    CONSTRAINT fk_role_permissions_role_id_roles FOREIGN KEY(role_id) REFERENCES roles (id) ON DELETE CASCADE, 
    CONSTRAINT fk_role_permissions_permission_id_permissions FOREIGN KEY(permission_id) REFERENCES permissions (id) ON DELETE CASCADE, 
    CONSTRAINT uq_role_permissions_role_perm UNIQUE (role_id, permission_id)
);

CREATE INDEX ix_role_permissions_role_id ON role_permissions (role_id);

CREATE INDEX ix_role_permissions_permission_id ON role_permissions (permission_id);

CREATE INDEX ix_role_permissions_deleted_at ON role_permissions (deleted_at);

CREATE TABLE tenant_members (
    id UUID NOT NULL, 
    tenant_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    status tenant_member_status_enum DEFAULT 'active' NOT NULL, 
    joined_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_tenant_members PRIMARY KEY (id), 
    CONSTRAINT fk_tenant_members_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_tenant_members_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_tenant_members_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX ix_tenant_members_tenant_id ON tenant_members (tenant_id);

CREATE INDEX ix_tenant_members_user_id ON tenant_members (user_id);

CREATE INDEX ix_tenant_members_status ON tenant_members (status);

CREATE INDEX ix_tenant_members_deleted_at ON tenant_members (deleted_at);

CREATE TABLE user_roles (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    role_id UUID NOT NULL, 
    tenant_id UUID, 
    assigned_by UUID, 
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_roles PRIMARY KEY (id), 
    CONSTRAINT fk_user_roles_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT fk_user_roles_role_id_roles FOREIGN KEY(role_id) REFERENCES roles (id) ON DELETE CASCADE, 
    CONSTRAINT fk_user_roles_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_user_roles_assigned_by_users FOREIGN KEY(assigned_by) REFERENCES users (id) ON DELETE SET NULL, 
    CONSTRAINT uq_user_roles_user_role_tenant UNIQUE (user_id, role_id, tenant_id)
);

CREATE INDEX ix_user_roles_user_id ON user_roles (user_id);

CREATE INDEX ix_user_roles_role_id ON user_roles (role_id);

CREATE INDEX ix_user_roles_tenant_id ON user_roles (tenant_id);

CREATE INDEX ix_user_roles_deleted_at ON user_roles (deleted_at);

CREATE TABLE tenant_settings (
    id UUID NOT NULL, 
    tenant_id UUID NOT NULL, 
    namespace VARCHAR(64) NOT NULL, 
    config JSONB NOT NULL, 
    version INTEGER DEFAULT '1' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_tenant_settings PRIMARY KEY (id), 
    CONSTRAINT fk_tenant_settings_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT uq_tenant_settings_tenant_namespace UNIQUE (tenant_id, namespace)
);

CREATE INDEX ix_tenant_settings_tenant_id ON tenant_settings (tenant_id);

CREATE INDEX ix_tenant_settings_namespace ON tenant_settings (namespace);

CREATE INDEX ix_tenant_settings_deleted_at ON tenant_settings (deleted_at);

CREATE TABLE user_identities (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    provider VARCHAR(50) NOT NULL, 
    provider_subject_id VARCHAR(255) NOT NULL, 
    metadata_json JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_identities PRIMARY KEY (id), 
    CONSTRAINT fk_user_identities_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_user_identities_provider_sub UNIQUE (provider, provider_subject_id)
);

CREATE INDEX ix_user_identities_user_id ON user_identities (user_id);

CREATE INDEX ix_user_identities_provider ON user_identities (provider);

CREATE INDEX ix_user_identities_deleted_at ON user_identities (deleted_at);

CREATE TABLE tenant_modules (
    id UUID NOT NULL, 
    tenant_id UUID NOT NULL, 
    module_id VARCHAR(64) NOT NULL, 
    is_active BOOLEAN DEFAULT false NOT NULL, 
    activated_at TIMESTAMP WITH TIME ZONE, 
    activated_by UUID, 
    config JSONB DEFAULT '{}'::jsonb NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_tenant_modules PRIMARY KEY (id), 
    CONSTRAINT uq_tenant_modules_tenant_module UNIQUE (tenant_id, module_id), 
    CONSTRAINT fk_tenant_modules_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_tenant_modules_activated_by_users FOREIGN KEY(activated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX ix_tenant_modules_module_id ON tenant_modules (module_id);

CREATE INDEX ix_tenant_modules_is_active ON tenant_modules (is_active);

CREATE INDEX ix_tenant_modules_tenant_id ON tenant_modules (tenant_id);

CREATE INDEX ix_tenant_modules_deleted_at ON tenant_modules (deleted_at);

CREATE TABLE tenant_plugins (
    id UUID NOT NULL, 
    tenant_id UUID NOT NULL, 
    plugin_id VARCHAR(64) NOT NULL, 
    is_active BOOLEAN DEFAULT false NOT NULL, 
    activated_at TIMESTAMP WITH TIME ZONE, 
    activated_by UUID, 
    config JSONB DEFAULT '{}'::jsonb NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_tenant_plugins PRIMARY KEY (id), 
    CONSTRAINT uq_tenant_plugins_tenant_plugin UNIQUE (tenant_id, plugin_id), 
    CONSTRAINT fk_tenant_plugins_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_tenant_plugins_activated_by_users FOREIGN KEY(activated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX ix_tenant_plugins_tenant_id ON tenant_plugins (tenant_id);

CREATE INDEX ix_tenant_plugins_deleted_at ON tenant_plugins (deleted_at);

CREATE INDEX ix_tenant_plugins_is_active ON tenant_plugins (is_active);

CREATE INDEX ix_tenant_plugins_plugin_id ON tenant_plugins (plugin_id);

CREATE TABLE api_keys (
    id UUID NOT NULL, 
    tenant_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    name VARCHAR(128) NOT NULL, 
    key_prefix VARCHAR(16) NOT NULL, 
    key_hash VARCHAR(64) NOT NULL, 
    scopes JSONB DEFAULT '[]' NOT NULL, 
    expires_at TIMESTAMP WITH TIME ZONE, 
    last_used_at TIMESTAMP WITH TIME ZONE, 
    is_revoked BOOLEAN DEFAULT false NOT NULL, 
    revoked_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_api_keys PRIMARY KEY (id), 
    CONSTRAINT fk_api_keys_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_api_keys_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_api_keys_key_prefix ON api_keys (key_prefix);

CREATE UNIQUE INDEX ix_api_keys_key_hash ON api_keys (key_hash);

CREATE INDEX ix_api_keys_is_revoked ON api_keys (is_revoked);

CREATE INDEX ix_api_keys_tenant_id ON api_keys (tenant_id);

CREATE INDEX ix_api_keys_user_id ON api_keys (user_id);

CREATE TABLE audit_logs (
    id UUID NOT NULL, 
    tenant_id UUID, 
    actor_id UUID, 
    actor_email VARCHAR(255), 
    actor_name VARCHAR(255), 
    action VARCHAR(50) NOT NULL, 
    entity_type VARCHAR(64) NOT NULL, 
    entity_id VARCHAR(128) NOT NULL, 
    entity_name VARCHAR(255), 
    changes JSONB DEFAULT '{}' NOT NULL, 
    ip_address VARCHAR(45), 
    user_agent VARCHAR(512), 
    correlation_id VARCHAR(128), 
    reason TEXT, 
    status VARCHAR(20) DEFAULT 'SUCCESS' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_audit_logs PRIMARY KEY (id), 
    CONSTRAINT fk_audit_logs_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_audit_logs_actor_id_users FOREIGN KEY(actor_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX ix_audit_logs_entity_id ON audit_logs (entity_id);

CREATE INDEX ix_audit_logs_status ON audit_logs (status);

CREATE INDEX ix_audit_logs_entity_type ON audit_logs (entity_type);

CREATE INDEX ix_audit_logs_tenant_id ON audit_logs (tenant_id);

CREATE INDEX ix_audit_logs_action ON audit_logs (action);

CREATE INDEX ix_audit_logs_deleted_at ON audit_logs (deleted_at);

CREATE INDEX ix_audit_logs_actor_id ON audit_logs (actor_id);

CREATE INDEX ix_audit_logs_correlation_id ON audit_logs (correlation_id);

CREATE INDEX ix_audit_logs_entity_history ON audit_logs (tenant_id, entity_type, entity_id, created_at);

ALTER TABLE permissions ADD COLUMN resource VARCHAR(50);

ALTER TABLE permissions ADD COLUMN action VARCHAR(50);

ALTER TABLE permissions ADD COLUMN default_scope VARCHAR(20) DEFAULT 'OWN' NOT NULL;

CREATE INDEX ix_permissions_resource ON permissions (resource);

CREATE INDEX ix_permissions_action ON permissions (action);

ALTER TABLE roles ADD COLUMN module_code VARCHAR(50);

ALTER TABLE roles ADD COLUMN can_delegate BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE roles ADD COLUMN max_delegatable_level INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX ix_roles_module_code ON roles (module_code);

ALTER TABLE role_permissions ADD COLUMN scope VARCHAR(20) DEFAULT 'OWN' NOT NULL;

ALTER TABLE role_permissions ADD COLUMN conditions JSONB;

ALTER TABLE user_roles ADD COLUMN department_id UUID;

ALTER TABLE user_roles ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX ix_user_roles_department_id ON user_roles (department_id);

CREATE TABLE user_module_grants (
    id UUID NOT NULL, 
    tenant_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    module_code VARCHAR(50) NOT NULL, 
    is_active BOOLEAN DEFAULT true NOT NULL, 
    granted_by UUID, 
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    expires_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    created_by UUID, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_by UUID, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    deleted_by UUID, 
    CONSTRAINT pk_user_module_grants PRIMARY KEY (id), 
    CONSTRAINT uq_user_module_grants_tenant_user_module UNIQUE (tenant_id, user_id, module_code), 
    CONSTRAINT fk_user_module_grants_tenant_id_tenants FOREIGN KEY(tenant_id) REFERENCES tenants (id) ON DELETE CASCADE, 
    CONSTRAINT fk_user_module_grants_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT fk_user_module_grants_granted_by_users FOREIGN KEY(granted_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX ix_user_module_grants_is_active ON user_module_grants (is_active);

CREATE INDEX ix_user_module_grants_user_id ON user_module_grants (user_id);

CREATE INDEX ix_user_module_grants_deleted_at ON user_module_grants (deleted_at);

CREATE INDEX ix_user_module_grants_tenant_id ON user_module_grants (tenant_id);

CREATE INDEX ix_user_module_grants_module_code ON user_module_grants (module_code);
`;
