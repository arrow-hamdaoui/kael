-- Kael Designer Supabase Schema
-- Strict, Scalable, and Relational Architecture

-- ==========================================================================
-- 1. CLIENTS TABLE
-- ==========================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    clinic_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create a client when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.clients (id, full_name, email)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New Client'), 
        new.email
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================================================
-- 2. CASES TABLE
-- ==========================================================================
CREATE TYPE case_status AS ENUM ('submitted', 'in_design', 'preview_ready', 'delivered');

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL CHECK (char_length(trim(patient_name)) > 0),
    case_type TEXT,
    status case_status DEFAULT 'submitted' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_cases_client_id ON cases(client_id);


-- ==========================================================================
-- 3. FILES TABLE
-- ==========================================================================
CREATE TYPE file_uploader_type AS ENUM ('client', 'admin');

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT, -- e.g., 'stl', 'ply', 'image', 'design'
    uploaded_by file_uploader_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_files_case_id ON files(case_id);


-- ==========================================================================
-- 4. MESSAGES TABLE
-- ==========================================================================
CREATE TYPE message_sender_type AS ENUM ('client', 'admin', 'system');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    sender message_sender_type NOT NULL,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_messages_case_id ON messages(case_id);


-- ==========================================================================
-- 5. INVOICES TABLE
-- ==========================================================================
CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid', 'overdue');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    status invoice_status DEFAULT 'unpaid' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_invoices_client_id ON invoices(client_id);


-- ==========================================================================
-- 6. INVOICE_ITEMS TABLE
-- ==========================================================================
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT, -- Prevent deleting a case if it is billed
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(invoice_id, case_id) -- A case can only be added to a specific invoice once
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_case_id ON invoice_items(case_id);

-- Trigger to automatically calculate the invoice total whenever an item is added/removed
CREATE OR REPLACE FUNCTION public.update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE invoices 
        SET total_amount = (SELECT COALESCE(SUM(price), 0) FROM invoice_items WHERE invoice_id = NEW.invoice_id)
        WHERE id = NEW.invoice_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE invoices 
        SET total_amount = (SELECT COALESCE(SUM(price), 0) FROM invoice_items WHERE invoice_id = OLD.invoice_id)
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invoice_item_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW EXECUTE PROCEDURE public.update_invoice_total();


-- ==========================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==========================================================================
-- Enforce strict data isolation for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Client Policies (Read/Write their own data only)
CREATE POLICY "Clients can view their own profile" ON clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clients can view their own cases" ON cases FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients can insert cases" ON cases FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can view their case files" ON files FOR SELECT USING (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Clients can insert files to their cases" ON files FOR INSERT WITH CHECK (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Clients can view their case messages" ON messages FOR SELECT USING (case_id IN (SELECT id FROM cases WHERE client_id = auth.uid()));
CREATE POLICY "Clients can view their invoices" ON invoices FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients can view their invoice items" ON invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE client_id = auth.uid()));
