-- ============================================================================
-- TONTINE TRUST - SCHÉMA COMPLET DE BASE DE DONNÉES SUPABASE
-- ✅ IDEMPOTENT : peut être ré-exécuté sans erreur même si les tables/policies existent déjà
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name            TEXT NOT NULL DEFAULT '',
    email           TEXT UNIQUE NOT NULL,
    initials        TEXT DEFAULT '',
    wallet_balance  NUMERIC DEFAULT 0 NOT NULL,
    score           INTEGER DEFAULT 500 NOT NULL,
    max_score       INTEGER DEFAULT 1000 NOT NULL,
    groups_count        INTEGER DEFAULT 0 NOT NULL,
    cycles_completed    INTEGER DEFAULT 0 NOT NULL,
    total_locked        NUMERIC DEFAULT 0 NOT NULL,
    talypay_customer_id TEXT DEFAULT NULL,
    phone               TEXT DEFAULT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Ajout de colonnes si elles n'existent pas encore (migration safe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance  NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS talypay_customer_id TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

-- RLS Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by members of same group." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

CREATE POLICY "Users can view their own profile."
    ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- TABLE: groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name                TEXT NOT NULL,
    initials            TEXT NOT NULL DEFAULT '',
    color               TEXT NOT NULL DEFAULT 'green',
    contribution_amount NUMERIC NOT NULL,
    frequency           TEXT NOT NULL DEFAULT 'Mensuelle',
    current_round       INTEGER DEFAULT 0 NOT NULL,
    total_rounds        INTEGER NOT NULL,
    max_members         INTEGER NOT NULL,
    members_count       INTEGER DEFAULT 0 NOT NULL,
    penalty_rate        NUMERIC DEFAULT 5 NOT NULL,
    guarantee_deposit   NUMERIC DEFAULT 0 NOT NULL,
    order_type          TEXT DEFAULT 'vrf' NOT NULL,
    min_score           INTEGER DEFAULT 0 NOT NULL,
    status              TEXT DEFAULT 'pending' NOT NULL,
    total_pool          NUMERIC DEFAULT 0 NOT NULL,
    next_payout_date    TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Colonnes manquantes si la table existait avant (migration safe)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS initials TEXT NOT NULL DEFAULT '';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'green';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'Mensuelle';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS members_count INTEGER DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS penalty_rate NUMERIC DEFAULT 5;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS guarantee_deposit NUMERIC DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'vrf';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS min_score INTEGER DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS total_pool NUMERIC DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS next_payout_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- RLS Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view groups." ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups." ON public.groups;
DROP POLICY IF EXISTS "Group creator can update the group." ON public.groups;

CREATE POLICY "Anyone can view groups."
    ON public.groups FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups."
    ON public.groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Group creator can update the group."
    ON public.groups FOR UPDATE USING (auth.uid() = created_by);

-- ============================================================================
-- TABLE: group_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_members (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id    UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role        TEXT DEFAULT 'member' NOT NULL,
    turn_order  INTEGER DEFAULT NULL,
    status      TEXT DEFAULT 'waiting' NOT NULL,
    paid_date   TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    joined_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(group_id, profile_id)
);

-- Colonnes manquantes si la table existait avant (migration safe)
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS turn_order INTEGER DEFAULT NULL;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- RLS Group Members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view group members of their groups." ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups." ON public.group_members;
DROP POLICY IF EXISTS "Members can update their own status." ON public.group_members;

CREATE POLICY "Users can view group members of their groups."
    ON public.group_members FOR SELECT USING (true);

CREATE POLICY "Users can join groups."
    ON public.group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can update their own status."
    ON public.group_members FOR UPDATE USING (auth.uid() = profile_id);

-- ============================================================================
-- TABLE: transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    group_id    UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    amount      NUMERIC NOT NULL,
    talypay_reference   TEXT DEFAULT NULL,
    talypay_status      TEXT DEFAULT NULL,
    customer_phone      TEXT DEFAULT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Colonnes optionnelles (migration safe)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS talypay_reference TEXT DEFAULT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS talypay_status TEXT DEFAULT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT NULL;

-- RLS Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions." ON public.transactions;

CREATE POLICY "Users can view their own transactions."
    ON public.transactions FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users can insert transactions."
    ON public.transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT false NOT NULL,
    color       TEXT DEFAULT 'blue' NOT NULL,
    navigate_to TEXT DEFAULT '/home',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;

CREATE POLICY "Users can view their own notifications."
    ON public.notifications FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can update their own notifications."
    ON public.notifications FOR UPDATE USING (auth.uid() = profile_id);

-- ============================================================================
-- TABLE: payment_requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    transaction_id  UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    talypay_ref     TEXT DEFAULT NULL,
    amount          NUMERIC NOT NULL,
    currency        TEXT DEFAULT 'XOF' NOT NULL,
    customer_phone  TEXT NOT NULL,
    operator        TEXT DEFAULT NULL,
    status          TEXT DEFAULT 'pending' NOT NULL,
    api_response    JSONB DEFAULT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS Payment Requests  ← LE CORRECTIF : DROP POLICY IF EXISTS avant chaque CREATE
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payment requests." ON public.payment_requests;
DROP POLICY IF EXISTS "Authenticated users can create payment requests." ON public.payment_requests;

CREATE POLICY "Users can view their own payment requests."
    ON public.payment_requests FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users can create payment requests."
    ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ============================================================================
-- TRIGGER: Création automatique du profil lors de l'inscription
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_initials TEXT;
    v_name TEXT;
BEGIN
    v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    v_initials := UPPER(LEFT(regexp_replace(v_name, '\s+', ' ', 'g'), 1))
              || COALESCE(UPPER(LEFT(split_part(v_name, ' ', 2), 1)), '');

    INSERT INTO public.profiles (id, email, name, initials, wallet_balance, score)
    VALUES (new.id, new.email, v_name, v_initials, 0, 500)
    ON CONFLICT (id) DO NOTHING;  -- Évite les doublons si re-exécuté

    INSERT INTO public.notifications (profile_id, type, title, message, color, navigate_to)
    VALUES (
        new.id, 'score',
        'Bienvenue sur TontineTrust ! 🎉',
        'Votre compte est créé avec un score de départ de 500 points. Rejoignez un groupe pour commencer !',
        'green', '/home'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- TRIGGER: Mise à jour automatique de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON public.payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON public.payment_requests
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================================
-- TRIGGER: Compteur de membres du groupe
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_group_members_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.groups SET members_count = GREATEST(members_count - 1, 0) WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_member_change ON public.group_members;
CREATE TRIGGER on_group_member_change
    AFTER INSERT OR DELETE ON public.group_members
    FOR EACH ROW EXECUTE PROCEDURE public.update_group_members_count();

-- ============================================================================
-- TRIGGER: Mise à jour du profil sur transaction (score, total_locked)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_profile_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'contribution' AND NEW.amount < 0 THEN
        UPDATE public.profiles
        SET total_locked = total_locked + ABS(NEW.amount),
            score = LEAST(score + 5, 1000)
        WHERE id = NEW.profile_id;
    ELSIF NEW.type = 'payout' AND NEW.amount > 0 THEN
        UPDATE public.profiles
        SET total_locked = GREATEST(total_locked - NEW.amount, 0),
            cycles_completed = cycles_completed + 1
        WHERE id = NEW.profile_id;
    ELSIF NEW.type = 'penalty' THEN
        UPDATE public.profiles
        SET score = GREATEST(score - 20, 0)
        WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;
CREATE TRIGGER on_transaction_created
    AFTER INSERT ON public.transactions
    FOR EACH ROW EXECUTE PROCEDURE public.update_profile_on_transaction();
