/**
 * KAEL DESIGNER — Core Sync Engine v2.0
 * Single source of truth for all case, client, invoice, and message data.
 * All reads/writes go through these functions.
 * Dark-theme aware — all injected HTML uses CSS vars or dark palette.
 * v2.1 — Added Portfolio Management
 */

// ── STATUS DEFINITIONS ────────────────────────────────────────────────────────
const CASE_STATUSES = ['Submitted', 'In Design', 'Preview Ready', 'Delivered'];

const STATUS_META = {
    'Submitted': { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: 'fa-inbox', label: 'Submitted' },
    'In Design': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: 'fa-pen-ruler', label: 'In Design' },
    'Preview Ready': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: 'fa-eye', label: 'Preview Ready' },
    'Delivered': { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-check-double', label: 'Delivered' },
};

const INV_STATUS = {
    'Pending': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: 'fa-clock', label: 'Unpaid' },
    'Paid': { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-circle-check', label: 'Paid' },
    'Overdue': { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: 'fa-triangle-exclamation', label: 'Overdue' },
};

// ── STORAGE KEYS ──────────────────────────────────────────────────────────────
const STORE = {
    cases: 'kael_cases',
    clients: 'kael_clients',
    invoices: 'kael_invoices',
    users: 'kael_registered_users',
    portfolio: 'kael_portfolio',
};

// ── CLOUD SYNC FLAG ───────────────────────────────────────────────────────────
let isSyncingFromCloud = false;

// ── CORE READ / WRITE ─────────────────────────────────────────────────────────
function kael_getCases() {
    kael_repairCases();
    return JSON.parse(localStorage.getItem(STORE.cases) || '[]');
}

function kael_saveCases(cases) {
    localStorage.setItem(STORE.cases, JSON.stringify(cases));
    window.dispatchEvent(new CustomEvent('kael_cases_updated'));
    kael_pushToCloud('cases', cases);
}

function kael_getClients() {
    kael_repairClients();
    return JSON.parse(localStorage.getItem(STORE.clients) || '[]');
}

function kael_saveClients(clients) {
    localStorage.setItem(STORE.clients, JSON.stringify(clients));
    window.dispatchEvent(new CustomEvent('kael_clients_updated'));
    kael_pushToCloud('clients', clients);
}

// ── CASE OPERATIONS ───────────────────────────────────────────────────────────
function kael_findCase(caseId) {
    return kael_getCases().find(c => c.id === caseId) || null;
}

function kael_updateCaseStatus(caseId, newStatus) {
    let cases = kael_getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;

    cases[idx].status = newStatus;
    cases[idx].statusUpdatedAt = new Date().toISOString();

    if (!cases[idx].messages) cases[idx].messages = [];
    cases[idx].messages.push({
        from: 'system',
        text: `Status updated to "${newStatus}"`,
        time: new Date().toISOString()
    });

    // Auto-set billing ready when delivered
    if (newStatus === 'Delivered') {
        cases[idx].billingReady = true;
        cases[idx].deliveredAt = new Date().toISOString();
    }

    kael_saveCases(cases);
    return true;
}

/** Admin delivers a case — sets Delivered + flags for billing */
function kael_deliverCase(caseId, designFiles = []) {
    let cases = kael_getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;

    cases[idx].status = 'Delivered';
    cases[idx].billingReady = true;
    cases[idx].deliveredAt = new Date().toISOString();

    if (designFiles.length > 0) {
        if (!cases[idx].designFiles) cases[idx].designFiles = [];
        cases[idx].designFiles.push(...designFiles);
    }

    if (!cases[idx].messages) cases[idx].messages = [];
    cases[idx].messages.push({
        from: 'system',
        text: `✅ Case delivered. Design files are now available for download.`,
        time: new Date().toISOString()
    });

    kael_saveCases(cases);
    return true;
}

function kael_updateCasePrice(caseId, price, internalNotes) {
    let cases = kael_getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;
    cases[idx].price = parseFloat(price) || 0;
    if (internalNotes !== undefined) cases[idx].internalNotes = internalNotes;
    kael_saveCases(cases);
    return true;
}

function kael_addDesignFiles(caseId, fileItems) {
    let cases = kael_getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;
    if (!cases[idx].designFiles) cases[idx].designFiles = [];
    cases[idx].designFiles.push(...fileItems); // items can be strings or {name,url}

    const labels = fileItems.map(f => typeof f === 'object' ? f.name : f);
    if (!cases[idx].messages) cases[idx].messages = [];
    cases[idx].messages.push({
        from: 'admin',
        text: `${fileItems.length} design file(s) uploaded: ${labels.join(', ')}`,
        time: new Date().toISOString()
    });
    kael_saveCases(cases);
    return true;
}

function kael_addMessage(caseId, fromRole, text) {
    let cases = kael_getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return false;
    if (!cases[idx].messages) cases[idx].messages = [];
    cases[idx].messages.push({ from: fromRole, text, time: new Date().toISOString() });
    kael_saveCases(cases);
    return true;
}

function kael_deleteCase(caseId) {
    const filtered = kael_getCases().filter(c => c.id !== caseId);
    kael_saveCases(filtered);
    return true;
}

function kael_deleteClient(email) {
    const filtered = kael_getClients().filter(c => c.email !== email);
    kael_saveClients(filtered);
    return true;
}

// ── BILLING ENGINE ────────────────────────────────────────────────────────────
function kael_getInvoices() {
    return JSON.parse(localStorage.getItem(STORE.invoices) || '[]');
}

function kael_saveInvoices(invoices) {
    localStorage.setItem(STORE.invoices, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent('kael_invoices_updated'));
    kael_pushToCloud('invoices', invoices);
}

function kael_findInvoice(invId) {
    return kael_getInvoices().find(i => i.id === invId) || null;
}

/** Returns cases that are Delivered but not yet invoiced for a given client */
function kael_getBillingReadyCases(clientEmail) {
    const invoicedIds = new Set();
    kael_getInvoices().forEach(inv => {
        (inv.caseItems || []).forEach(item => invoicedIds.add(item.id));
    });
    return kael_getCases().filter(c =>
        c.clientEmail === clientEmail &&
        c.status === 'Delivered' &&
        !invoicedIds.has(c.id)
    );
}

/** All cases for a client that are invoiced (for reference) */
function kael_getInvoicedCaseIds() {
    const ids = new Set();
    kael_getInvoices().forEach(inv => (inv.caseItems || []).forEach(item => ids.add(item.id)));
    return ids;
}

/**
 * Create invoice from an array of case objects.
 * Auto-pulls id, type, price from each case.
 * Auto-marks cases as invoiced.
 */
function kael_createInvoice(clientEmail, clientName, period, cases) {
    const caseItems = cases.map(c => ({
        id: c.id,
        patient: c.patient || 'N/A',
        type: c.type || 'Design',
        price: parseFloat(c.price) || 0,
        date: c.date || c.deliveredAt || new Date().toISOString(),
    }));

    const total = caseItems.reduce((s, c) => s + c.price, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const inv = {
        id: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000 + 1000)),
        clientEmail,
        clientName,
        period: period || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        caseItems,
        amount: total,
        status: 'Pending',
        messages: [],
        sharedWithClient: true,
    };

    // Mark cases as invoiced
    let allCases = kael_getCases();
    cases.forEach(c => {
        const idx = allCases.findIndex(ac => ac.id === c.id);
        if (idx !== -1) allCases[idx].invoiced = true;
    });
    kael_saveCases(allCases);

    let invoices = kael_getInvoices();
    invoices.unshift(inv);
    kael_saveInvoices(invoices);
    return inv;
}

function kael_updateInvoiceStatus(invId, newStatus) {
    let invoices = kael_getInvoices();
    const idx = invoices.findIndex(i => i.id === invId);
    if (idx === -1) return false;

    invoices[idx].status = newStatus;

    if (newStatus === 'Paid') {
        invoices[idx].paidAt = new Date().toISOString();
        if (!invoices[idx].messages) invoices[idx].messages = [];
        invoices[idx].messages.push({
            from: 'system',
            text: '✅ Payment confirmed by Kael Designer. Thank you!',
            time: new Date().toISOString()
        });
    }

    kael_saveInvoices(invoices);
    return true;
}

function kael_addInvoiceMessage(invId, fromRole, text) {
    let invoices = kael_getInvoices();
    const idx = invoices.findIndex(i => i.id === invId);
    if (idx === -1) return false;
    if (!invoices[idx].messages) invoices[idx].messages = [];
    invoices[idx].messages.push({ from: fromRole, text, time: new Date().toISOString() });
    kael_saveInvoices(invoices);
    return true;
}

/** Auto-mark overdue invoices */
function kael_checkOverdue() {
    let invoices = kael_getInvoices();
    const today = new Date();
    let changed = false;
    invoices.forEach(inv => {
        if (inv.status === 'Pending' && inv.dueDate) {
            if (new Date(inv.dueDate) < today) {
                inv.status = 'Overdue';
                changed = true;
            }
        }
    });
    if (changed) kael_saveInvoices(invoices);
}

/** Unified client balance summary */
function kael_getClientBalance(clientEmail) {
    const invoices = kael_getInvoices().filter(i => i.clientEmail === clientEmail);
    const invoicedIds = kael_getInvoicedCaseIds();
    const cases = kael_getCases().filter(c => c.clientEmail === clientEmail);

    const unbilled = cases.filter(c => parseFloat(c.price) > 0 && !invoicedIds.has(c.id) && c.status === 'Delivered');
    const unpaid = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue');
    const paid = invoices.filter(i => i.status === 'Paid');

    return {
        totalUnbilled: unbilled.reduce((s, c) => s + (parseFloat(c.price) || 0), 0),
        unbilledCount: unbilled.length,
        totalUnpaid: unpaid.reduce((s, i) => s + i.amount, 0),
        totalPaid: paid.reduce((s, i) => s + i.amount, 0),
        lastPayment: paid.length > 0 ? (paid[0].paidAt || paid[0].date) : null,
        overdueCount: invoices.filter(i => i.status === 'Overdue').length,
    };
}

/** Aggregated stats for a single client (for admin client table) */
function kael_getClientStats(clientEmail) {
    const cases = kael_getCases().filter(c => c.clientEmail === clientEmail);
    const balance = kael_getClientBalance(clientEmail);
    return {
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status !== 'Delivered').length,
        deliveredCases: cases.filter(c => c.status === 'Delivered').length,
        ...balance,
    };
}

// ── UI HELPERS ────────────────────────────────────────────────────────────────
function kael_statusBadgeHtml(status) {
    const m = STATUS_META[status] || STATUS_META['Submitted'];
    return `<span style="
        display:inline-flex; align-items:center; gap:0.5rem;
        background:${m.bg}; color:${m.color};
        padding:0.4rem 1rem; border-radius:12px;
        font-size:0.75rem; font-weight:800; white-space:nowrap;
        border:1px solid ${m.color}33; text-transform:uppercase; letter-spacing:0.5px;">
        <i class="fa-solid ${m.icon}" style="font-size:0.75rem;"></i> ${m.label}
    </span>`;
}

function kael_statusProgressHtml(status) {
    const steps = CASE_STATUSES;
    const current = steps.indexOf(status);
    return `<div style="display:flex; gap:0.25rem; align-items:center; margin:1.5rem 0; width:100%;">
        ${steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const m = STATUS_META[s];
        const col = (done || active) ? m.color : '#e2e8f0';
        const bg = (done || active) ? m.bg : '#f8fafc';

        return `
            <div style="display:flex; flex-direction:column; align-items:center; flex:1; position:relative;">
                <div style="
                    width:42px; height:42px; border-radius:14px;
                    background:${bg};
                    border:2px solid ${col};
                    color:${col};
                    display:flex; align-items:center; justify-content:center;
                    font-size:1rem; flex-shrink:0; transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index:2; ${active ? `box-shadow: 0 10px 20px ${m.color}33; transform: scale(1.1);` : ''}">
                    <i class="fa-solid ${done ? 'fa-check' : m.icon}"></i>
                </div>
                <div style="margin-top:0.75rem; text-align:center;">
                    <div style="font-size:0.65rem; font-weight:800; color:${active ? m.color : (done ? '#64748b' : '#cbd5e1')}; text-transform:uppercase; letter-spacing:0.5px;">${s}</div>
                </div>
                ${i < steps.length - 1 ? `
                <div style="position:absolute; top:21px; left:calc(50% + 24px); width:calc(100% - 48px); height:3px; background:${done ? m.color : '#f1f5f9'}; border-radius:2px; z-index:1;"></div>
                ` : ''}
            </div>`;
    }).join('')}
    </div>`;
}

function kael_formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function kael_formatDate(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function kael_messagesHtml(messages, viewerRole) {
    if (!messages || messages.length === 0) {
        return `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.3; padding:2rem;">
            <i class="fa-solid fa-comments-bubble" style="font-size:2.5rem; margin-bottom:1rem;"></i>
            <p style="font-size:0.9rem; font-weight:600;">No clinical dialogue yet.</p>
        </div>`;
    }
    return messages.map(m => {
        if (m.from === 'system') {
            return `<div style="text-align:center; margin:1rem 0;">
                <span style="font-size:0.65rem; font-weight:800; color:#94a3b8; background:#f1f5f9; padding:0.4rem 1rem; border-radius:50px; text-transform:uppercase; letter-spacing:1px; border:1px solid #e2e8f0;">${m.text}</span>
            </div>`;
        }
        const isMe = m.from === viewerRole;
        const bubbleBg = isMe ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#f1f5f9';
        const textCol = isMe ? 'white' : '#1e293b';
        const shadow = isMe ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none';

        return `<div style="display:flex; justify-content:${isMe ? 'flex-end' : 'flex-start'}; margin:0.75rem 0;">
            <div style="
                max-width:85%; padding:1rem 1.25rem; border-radius:20px;
                background:${bubbleBg}; color:${textCol};
                font-size:0.9rem; line-height:1.6;
                box-shadow:${shadow};
                border-bottom-${isMe ? 'right' : 'left'}-radius:4px;">
                <div style="font-size:0.7rem; opacity:0.7; margin-bottom:0.4rem; font-weight:700;">
                    ${m.from === 'admin' ? 'KAEL DESIGN TEAM' : 'CLINICIAN'} · ${kael_formatTime(m.time)}
                </div>
                <div style="font-weight:500;">${m.text}</div>
            </div>
        </div>`;
    }).join('');
}

// ── BILLING UI HELPERS ────────────────────────────────────────────────────────
function kael_invStatusBadge(status) {
    const m = INV_STATUS[status] || INV_STATUS['Pending'];
    return `<span style="display:inline-flex;align-items:center;gap:0.4rem;
        background:${m.bg};color:${m.color};
        padding:0.3rem 0.75rem;border-radius:20px;
        font-size:0.78rem;font-weight:700;white-space:nowrap;
        border:1px solid ${m.color}22;">
        <i class="fa-solid ${m.icon}" style="font-size:0.65rem;"></i> ${m.label}
    </span>`;
}

function kael_invoiceLineItemsHtml(items) {
    if (!items || items.length === 0) {
        return `<p style="color:rgba(255,255,255,0.3);font-size:0.82rem;">No line items.</p>`;
    }
    return items.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;
            padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.85rem;">
            <div>
                <div style="font-weight:700;color:#fff;">${item.patient} <span style="font-weight:400;color:rgba(255,255,255,0.4);font-size:0.75rem;margin-left:0.5rem;">${item.id}</span></div>
                <div style="color:rgba(255,255,255,0.4);font-size:0.75rem;">${item.type}</div>
            </div>
            <strong style="color:#00D1FF;">$${(item.price || 0).toFixed(2)}</strong>
        </div>`).join('');
}

function kael_invMessagesHtml(messages, viewerRole) {
    return kael_messagesHtml(messages, viewerRole);
}

// ── SELF-HEALING ──────────────────────────────────────────────────────────────
function kael_repairCases() {
    let cases = JSON.parse(localStorage.getItem(STORE.cases) || '[]');
    const clients = JSON.parse(localStorage.getItem(STORE.clients) || '[]');
    let changed = false;

    cases.forEach(c => {
        if (!c.clientEmail) {
            const match = clients.find(cl =>
                (c.doctor && cl.name && cl.name.toLowerCase() === c.doctor.toLowerCase()) ||
                (c.clinic && cl.clinic && cl.clinic.toLowerCase() === c.clinic.toLowerCase())
            );
            if (match) { c.clientEmail = match.email; changed = true; }
        }
        // Ensure billingReady is set for all delivered cases
        if (c.status === 'Delivered' && !c.billingReady) {
            c.billingReady = true;
            changed = true;
        }
    });

    if (changed) localStorage.setItem(STORE.cases, JSON.stringify(cases));
}

function kael_repairClients() {
    const cases = JSON.parse(localStorage.getItem(STORE.cases) || '[]');
    const registered = JSON.parse(localStorage.getItem(STORE.users) || '[]');
    let clients = JSON.parse(localStorage.getItem(STORE.clients) || '[]');
    let changed = false;

    cases.forEach(c => {
        if (c.clientEmail && !clients.find(cl => cl.email === c.clientEmail)) {
            clients.push({ id: 'CL-' + Math.random().toString(36).substr(2, 6).toUpperCase(), name: c.doctor || 'Unknown Doctor', clinic: c.clinic || 'Unknown Clinic', email: c.clientEmail, phone: '', status: 'Active', createdAt: new Date().toISOString() });
            changed = true;
        }
    });

    registered.forEach(u => {
        if (!clients.find(cl => cl.email === u.email)) {
            clients.push({
                id: 'CL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                name: u.name,
                clinic: u.clinic,
                email: u.email,
                phone: u.phone || '',
                password: u.password || '',
                status: 'Active',
                createdAt: new Date().toISOString()
            });
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem(STORE.clients, JSON.stringify(clients));
        window.dispatchEvent(new CustomEvent('kael_clients_updated'));
    }
}

/** Aggregate all system activity into a chronological feed */
function kael_getSystemActivity() {
    const activity = [];
    kael_getCases().forEach(c => {
        activity.push({ type: 'case', caseId: c.id, title: `Case ${c.id}`, msg: `<strong>${c.doctor}</strong> submitted a ${c.type} case for <strong>${c.patient || 'N/A'}</strong>.`, time: c.date || new Date().toISOString(), status: c.status });
        if (c.status === 'Delivered') {
            activity.push({ type: 'delivery', caseId: c.id, title: 'Case Delivered', msg: `Final design for <strong>${c.patient || c.id}</strong> delivered to <strong>${c.doctor}</strong>.`, time: c.deliveredAt || c.date || new Date().toISOString() });
        }
    });
    kael_getInvoices().forEach(inv => {
        activity.push({ type: 'billing', title: `Invoice ${inv.id}`, msg: `Invoice generated for <strong>${inv.clientName}</strong> ($${inv.amount.toFixed(2)}).`, time: inv.date || new Date().toISOString() });
        if (inv.status === 'Paid') {
            activity.push({ type: 'billing', title: 'Payment Received', msg: `Invoice <strong>${inv.id}</strong> marked as Paid.`, time: inv.paidAt || inv.date || new Date().toISOString() });
        }
    });
    kael_getClients().forEach(cl => {
        activity.push({ type: 'client', title: 'New Client', msg: `<strong>${cl.name}</strong> (${cl.clinic}) joined.`, time: cl.createdAt || new Date().toISOString() });
    });
    return activity.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 50);
}

// ── PORTFOLIO MANAGEMENT ──────────────────────────────────────────────────────
function kael_getPortfolio() {
    return JSON.parse(localStorage.getItem(STORE.portfolio) || '[]');
}

function kael_savePortfolio(items) {
    localStorage.setItem(STORE.portfolio, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('kael_portfolio_updated'));
    kael_pushToCloud('portfolio', items);
}

function kael_addPortfolio(item) {
    let items = kael_getPortfolio();
    items.unshift(item); // Newest first
    kael_savePortfolio(items);
    return true;
}

function kael_deletePortfolio(index) {
    let items = kael_getPortfolio();
    items.splice(index, 1);
    kael_savePortfolio(items);
    return true;
}

// Auto-run on every page load
kael_repairCases();
kael_repairClients();
kael_checkOverdue();

// ── SUPABASE CLOUD SYNC ───────────────────────────────────────────────────────
async function kael_pushToCloud(key, data) {
    if (isSyncingFromCloud) return;
    try {
        await sb
            .from('kael_store')
            .upsert({ id: key, payload: JSON.stringify(data), updated_at: new Date() });
    } catch (err) {
        console.warn("Cloud push failed:", err);
    }
}

async function kael_pullFromCloud() {
    try {
        const { data, error } = await sb.from('kael_store').select('*');
        if (error) throw error;
        
        isSyncingFromCloud = true;
        data.forEach(row => {
            localStorage.setItem(`kael_${row.id}`, row.payload);
        });
        
        // Trigger all updates
        window.dispatchEvent(new CustomEvent('kael_cases_updated'));
        window.dispatchEvent(new CustomEvent('kael_clients_updated'));
        window.dispatchEvent(new CustomEvent('kael_invoices_updated'));
        window.dispatchEvent(new CustomEvent('kael_portfolio_updated'));
        isSyncingFromCloud = false;
        console.log("☁️ Cloud Data Pulled & Synced");
    } catch (err) {
        console.warn("Cloud pull failed:", err);
    }
}

// Subscribe to Realtime
sb
    .channel('kael_realtime')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kael_store' }, payload => {
        const key = payload.new.id;
        const data = payload.new.payload;
        
        isSyncingFromCloud = true;
        localStorage.setItem(`kael_${key}`, data);
        window.dispatchEvent(new CustomEvent(`kael_${key}_updated`));
        isSyncingFromCloud = false;
        console.log(`📡 Realtime Sync: ${key}`);
    })
    .subscribe();

// Initial Pull
kael_pullFromCloud();
