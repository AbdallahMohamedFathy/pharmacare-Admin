let universitiesCache = [];
let facultiesCache = [];
let deansCache = [];
let currentResetDeanId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadAll();
});

function initTabs() {
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(`panel-${item.dataset.panel}`).classList.add('active');
        });
    });
}

async function loadAll() {
    await loadUniversities();
    await loadFaculties();
    await loadDeans();
}

// ─── Universities ──────────────────────────────────────────────────────────────

async function loadUniversities() {
    const body = document.getElementById('universities-table-body');
    try {
        const res = await fetchUniversities();
        const dataRoot = res?.data || res;
        universitiesCache = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || []);

        if (!universitiesCache.length) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">No universities yet.</td></tr>';
        } else {
            body.innerHTML = universitiesCache.map(buildUniversityRow).join('');
        }
        populateUniversityDropdown();
    } catch (err) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--danger);">Failed to load: ${err.message}</td></tr>`;
    }
}

function buildUniversityRow(u) {
    return `
    <tr>
        <td style="font-weight:600;">${u.nameAr || '—'}</td>
        <td>${u.nameEn || '—'}</td>
        <td>${u.country || '—'}</td>
        <td>${u.facultiesCount ?? 0}</td>
    </tr>`;
}

function populateUniversityDropdown() {
    const select = document.getElementById('fac-universityId');
    if (!select) return;
    if (!universitiesCache.length) {
        select.innerHTML = '<option value="">No universities — create one first</option>';
        return;
    }
    select.innerHTML = universitiesCache
        .map(u => `<option value="${u.id}">${u.nameAr} (${u.nameEn})</option>`)
        .join('');
}

async function doCreateUniversity() {
    const nameAr = document.getElementById('uni-nameAr').value.trim();
    const nameEn = document.getElementById('uni-nameEn').value.trim();
    const country = document.getElementById('uni-country').value.trim() || 'Egypt';

    if (!nameAr || !nameEn) {
        Swal.fire('Required', 'Please enter both Arabic and English names.', 'warning');
        return;
    }

    const btn = document.getElementById('create-uni-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating...';
    btn.disabled = true;

    try {
        await createUniversity(nameAr, nameEn, country);
        document.getElementById('uni-nameAr').value = '';
        document.getElementById('uni-nameEn').value = '';
        showToast('success', 'University created.');
        await loadUniversities();
    } catch (err) {
        Swal.fire('Failed', err.message, 'error');
    } finally {
        btn.innerHTML = '<i class="bx bx-plus"></i> Create University';
        btn.disabled = false;
    }
}

// ─── Faculties ──────────────────────────────────────────────────────────────────

async function loadFaculties() {
    const body = document.getElementById('faculties-table-body');
    try {
        const res = await fetchFaculties();
        const dataRoot = res?.data || res;
        facultiesCache = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || []);

        if (!facultiesCache.length) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);">No faculties yet.</td></tr>';
        } else {
            body.innerHTML = facultiesCache.map(buildFacultyRow).join('');
        }
        populateFacultyDropdown();
    } catch (err) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--danger);">Failed to load: ${err.message}</td></tr>`;
    }
}

function resolveUniversityName(universityId) {
    const u = universitiesCache.find(x => x.id === universityId);
    return u ? `${u.nameAr} (${u.nameEn})` : '—';
}

function buildFacultyRow(f) {
    const statusCls = f.isActive ? 'success' : 'danger';
    return `
    <tr>
        <td style="font-weight:600;">${f.nameAr || '—'}</td>
        <td>${f.nameEn || '—'}</td>
        <td>${f.code || '—'}</td>
        <td>${resolveUniversityName(f.universityId)}</td>
        <td><span class="status-badge ${statusCls}">${f.isActive ? 'Active' : 'Inactive'}</span></td>
    </tr>`;
}

function populateFacultyDropdown() {
    const select = document.getElementById('dean-facultyId');
    if (!select) return;
    if (!facultiesCache.length) {
        select.innerHTML = '<option value="">No faculties — create one first</option>';
        return;
    }
    // Group by university for readability
    const byUniversity = {};
    facultiesCache.forEach(f => {
        const key = f.universityId || 'unknown';
        if (!byUniversity[key]) byUniversity[key] = [];
        byUniversity[key].push(f);
    });
    select.innerHTML = Object.entries(byUniversity).map(([universityId, faculties]) => {
        const label = resolveUniversityName(universityId);
        const options = faculties.map(f => `<option value="${f.id}">${f.nameAr} — ${f.code}</option>`).join('');
        return `<optgroup label="${label}">${options}</optgroup>`;
    }).join('');
}

async function doCreateFaculty() {
    const universityId = document.getElementById('fac-universityId').value;
    const nameAr = document.getElementById('fac-nameAr').value.trim();
    const nameEn = document.getElementById('fac-nameEn').value.trim();
    const code = document.getElementById('fac-code').value.trim();
    const isActive = document.getElementById('fac-isActive').checked;

    if (!universityId) { Swal.fire('Required', 'Please select a university.', 'warning'); return; }
    if (!nameAr || !nameEn || !code) { Swal.fire('Required', 'Please fill in name (AR/EN) and code.', 'warning'); return; }

    const btn = document.getElementById('create-fac-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating...';
    btn.disabled = true;

    try {
        await createFaculty(universityId, nameAr, nameEn, code, isActive);
        document.getElementById('fac-nameAr').value = '';
        document.getElementById('fac-nameEn').value = '';
        document.getElementById('fac-code').value = '';
        showToast('success', 'Faculty created.');
        await loadUniversities(); // refresh facultiesCount on the university
        await loadFaculties();
    } catch (err) {
        Swal.fire('Failed', err.message, 'error');
    } finally {
        btn.innerHTML = '<i class="bx bx-plus"></i> Create Faculty';
        btn.disabled = false;
    }
}

// ─── Faculty Deans ──────────────────────────────────────────────────────────────

async function loadDeans() {
    const body = document.getElementById('deans-table-body');
    try {
        const res = await fetchDeans();
        const dataRoot = res?.data || res;
        deansCache = Array.isArray(dataRoot) ? dataRoot : (dataRoot.items || []);

        if (!deansCache.length) {
            body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No deans provisioned yet.</td></tr>';
        } else {
            body.innerHTML = deansCache.map(buildDeanRow).join('');
        }
    } catch (err) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--danger);">Failed to load: ${err.message}</td></tr>`;
    }
}

function buildDeanRow(d) {
    const initials = (d.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const statusCls = d.isActive ? 'success' : 'danger';
    const apptDate = d.appointmentDate ? new Date(d.appointmentDate).toLocaleDateString() : '—';
    const idJs = JSON.stringify(d.id || d.deanId);
    const nameJs = JSON.stringify(d.name || '');

    return `
    <tr>
        <td>
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px;height:36px;border-radius:50%;background:#eff6ff;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${initials}</div>
                <div>
                    <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${d.name || '—'}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${d.email || ''}</div>
                </div>
            </div>
        </td>
        <td>${d.facultyName || '—'}</td>
        <td>${d.universityName || '—'}</td>
        <td><span class="status-badge ${statusCls}">${d.isActive ? 'Active' : 'Inactive'}</span></td>
        <td style="font-size:13px; color:var(--text-muted);">${apptDate}</td>
        <td>
            <div class="table-actions">
                ${d.isActive
                    ? `<button class="action-btn" style="background:#fffbeb; color:#d97706;" title="Suspend" onclick='doToggleDeanStatus(${idJs}, ${nameJs}, true)'><i class='bx bx-pause-circle'></i></button>`
                    : `<button class="action-btn" style="background:#ecfdf5; color:#059669;" title="Activate" onclick='doToggleDeanStatus(${idJs}, ${nameJs}, false)'><i class='bx bx-check-circle'></i></button>`
                }
                <button class="action-btn" style="background:#f8f9fa; color:#64748b;" title="Reset Password" onclick='openDeanResetModal(${idJs}, ${nameJs})'>
                    <i class='bx bx-key'></i>
                </button>
            </div>
        </td>
    </tr>`;
}

// ─── Provision Dean Modal ───────────────────────────────────────────────────────

function openDeanModal() {
    ['dean-name', 'dean-email', 'dean-password', 'dean-academicTitle', 'dean-phone', 'dean-office', 'dean-appointmentDate']
        .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('dean-duplicate-warning').style.display = 'none';
    document.getElementById('dean-submit-btn').disabled = false;
    populateFacultyDropdown();
    document.getElementById('dean-modal').classList.add('active');
    checkDuplicateDean();
    setTimeout(() => document.getElementById('dean-name').focus(), 200);
}

function closeDeanModal() {
    document.getElementById('dean-modal').classList.remove('active');
}

// Backend rejects with 409 if the faculty already has an active Dean (no auto-archive) —
// so this is a hard block, not just a heads-up.
function findActiveDeanForFaculty(facultyId) {
    return deansCache.find(d => d.isActive && d.facultyId === facultyId);
}

function checkDuplicateDean() {
    const facultyId = document.getElementById('dean-facultyId').value;
    const warning = document.getElementById('dean-duplicate-warning');
    const submitBtn = document.getElementById('dean-submit-btn');

    const activeDean = findActiveDeanForFaculty(facultyId);
    if (activeDean) {
        document.getElementById('dean-duplicate-warning-text').textContent =
            `This faculty already has an active Dean (${activeDean.name}). Deactivate them first from the table below — the backend rejects this request otherwise.`;
        warning.style.display = 'flex';
        submitBtn.disabled = true;
    } else {
        warning.style.display = 'none';
        submitBtn.disabled = false;
    }
}

async function doCreateDean() {
    const payload = {
        name: document.getElementById('dean-name').value.trim(),
        email: document.getElementById('dean-email').value.trim(),
        password: document.getElementById('dean-password').value,
        academicTitle: document.getElementById('dean-academicTitle').value.trim(),
        facultyId: document.getElementById('dean-facultyId').value,
        phone: document.getElementById('dean-phone').value.trim(),
        office: document.getElementById('dean-office').value.trim(),
        appointmentDate: document.getElementById('dean-appointmentDate').value,
    };

    if (!payload.name || !payload.email || !payload.password || !payload.facultyId) {
        Swal.fire('Required', 'Please fill in name, email, password, and faculty.', 'warning');
        return;
    }

    // Defense in depth: re-check even though the dropdown's onchange + submit-button
    // disabling should already have blocked this.
    if (findActiveDeanForFaculty(payload.facultyId)) {
        Swal.fire('Faculty Already Has a Dean', 'Deactivate the current Dean for this faculty before provisioning a new one.', 'warning');
        return;
    }

    const btn = document.getElementById('dean-submit-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Provisioning...';
    btn.disabled = true;

    try {
        const res = await createDean(payload);
        const data = res?.data || res;
        closeDeanModal();

        if (data.generatedPassword) {
            await Swal.fire({
                title: 'Dean Account Created',
                html: `<p style="font-size:13px;color:#64748b;margin-bottom:12px;">Share these credentials with <strong>${payload.name}</strong>:</p>
                       <div style="background:#f1f5f9;border-radius:8px;padding:12px;text-align:left;">
                           <div style="font-size:11px;color:#64748b;text-transform:uppercase;">Email</div>
                           <div style="font-weight:600;margin-bottom:8px;">${payload.email}</div>
                           <div style="font-size:11px;color:#64748b;text-transform:uppercase;">Password</div>
                           <div style="font-family:monospace;font-weight:700;">${data.generatedPassword}</div>
                       </div>`,
                icon: 'success',
                confirmButtonText: 'Copy & Close',
                showCancelButton: true,
                cancelButtonText: 'Close',
            }).then(r => {
                if (r.isConfirmed) navigator.clipboard.writeText(`Email: ${payload.email}\nPassword: ${data.generatedPassword}`).catch(() => {});
            });
        } else {
            showToast('success', res.message || `Dean account created for ${payload.email}.`);
        }
        await loadDeans();
    } catch (err) {
        const msg = err.message || '';
        if (err.status === 409 || msg.includes('409') || msg.toLowerCase().includes('active dean')) {
            Swal.fire('Faculty Already Has an Active Dean', 'Deactivate the current Dean for this faculty first, then try again.', 'warning');
        } else {
            Swal.fire('Failed', msg, 'error');
        }
    } finally {
        btn.innerHTML = '<i class="bx bx-user-check"></i> Provision Dean';
        btn.disabled = false;
    }
}

// ─── Row Actions: Status Toggle ─────────────────────────────────────────────────

async function doToggleDeanStatus(deanId, name, currentlyActive) {
    let reason = '';
    if (currentlyActive) {
        const { isConfirmed, value } = await Swal.fire({
            title: `Suspend ${name}?`,
            text: 'They will lose Dean dashboard access until reactivated.',
            icon: 'warning',
            input: 'text',
            inputPlaceholder: 'Reason (optional)',
            showCancelButton: true,
            confirmButtonText: 'Suspend', confirmButtonColor: '#f59e0b',
        });
        if (!isConfirmed) return;
        reason = value || '';
    } else {
        const { isConfirmed } = await Swal.fire({
            title: `Reactivate ${name}?`,
            icon: 'question', showCancelButton: true,
            confirmButtonText: 'Reactivate', confirmButtonColor: '#10b981',
        });
        if (!isConfirmed) return;
    }

    try {
        const res = await updateDeanStatus(deanId, !currentlyActive, reason);
        showToast('success', res.message || 'Dean status updated.');
        await loadDeans();
    } catch (err) {
        Swal.fire('Failed', err.message, 'error');
    }
}

// ─── Row Actions: Reset Password ────────────────────────────────────────────────

function openDeanResetModal(deanId, name) {
    currentResetDeanId = deanId;
    document.getElementById('dean-reset-name-line').textContent = `Set a new temporary password for ${name}.`;
    document.getElementById('dean-reset-password').value = '';
    document.getElementById('dean-reset-modal').classList.add('active');
    setTimeout(() => document.getElementById('dean-reset-password').focus(), 200);
}

function closeDeanResetModal() {
    document.getElementById('dean-reset-modal').classList.remove('active');
    currentResetDeanId = null;
}

async function doConfirmResetDeanPassword() {
    const newPassword = document.getElementById('dean-reset-password').value;
    if (!newPassword || newPassword.length < 8) {
        Swal.fire('Required', 'Please enter a password with at least 8 characters.', 'warning');
        return;
    }

    const btn = document.getElementById('dean-reset-btn');
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Resetting...';
    btn.disabled = true;

    try {
        const res = await resetDeanPassword(currentResetDeanId, newPassword);
        closeDeanResetModal();
        showToast('success', res.message || 'Password reset.');
    } catch (err) {
        Swal.fire('Failed', err.message, 'error');
    } finally {
        btn.innerHTML = '<i class="bx bx-key"></i> Reset Password';
        btn.disabled = false;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showToast(icon, title) {
    Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
        .fire({ icon, title });
}
