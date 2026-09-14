// ─── Super Admin API ──────────────────────────────────────────────────────────
// All endpoints under /api/v1/super-admin/* (SuperAdmin role required)

// ─── Admin Management ─────────────────────────────────────────────────────────

async function inviteAdmin(email) {
    return await apiClient.post('/super-admin/admins/invite', { email });
}

async function fetchAdmins(page = 1, pageSize = 20, search = '', status = '', role = '', isLocked = '') {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    if (role) query += `&role=${encodeURIComponent(role)}`;
    if (isLocked !== '') query += `&isLocked=${isLocked}`;
    return await apiClient.get(`/super-admin/admins?${query}`);
}

async function fetchAdminById(id) {
    return await apiClient.get(`/super-admin/admins/${id}`);
}

async function fetchAdminActivity(adminUserId = '', action = '', from = '', to = '', page = 1, pageSize = 20) {
    let query = `page=${page}&pageSize=${pageSize}`;
    if (adminUserId) query += `&adminUserId=${adminUserId}`;
    if (action) query += `&action=${encodeURIComponent(action)}`;
    if (from) query += `&from=${encodeURIComponent(from)}`;
    if (to) query += `&to=${encodeURIComponent(to)}`;
    return await apiClient.get(`/super-admin/admins/activity?${query}`);
}

async function fetchAdminStats() {
    return await apiClient.get('/super-admin/stats');
}

async function promoteToAdmin(email) {
    return await apiClient.post('/super-admin/admins/promote', { email });
}

async function removeAdminRole(email) {
    return await apiClient.post('/super-admin/admins/remove', { email });
}

async function promoteToSuperAdmin(email) {
    return await apiClient.post('/super-admin/admins/promote-super-admin', { email });
}

async function removeSuperAdminRole(email) {
    return await apiClient.post('/super-admin/admins/remove-super-admin', { email });
}

async function lockAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/lock`, {});
}

async function unlockAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/unlock`, {});
}

async function suspendAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/suspend`, {});
}

async function reactivateAdmin(id) {
    return await apiClient.post(`/super-admin/admins/${id}/reactivate`, {});
}

async function resetAdminPassword(id) {
    return await apiClient.post(`/super-admin/admins/${id}/reset-password`, {});
}

// ─── Platform Configuration ───────────────────────────────────────────────────

async function fetchPlatformConfig() {
    return await apiClient.get('/super-admin/settings');
}

async function updatePlatformConfig(data) {
    return await apiClient.put('/super-admin/settings', data);
}

// ─── System Health ────────────────────────────────────────────────────────────

async function fetchSystemHealth() {
    return await apiClient.get('/super-admin/system-health');
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function fetchStorageStatus() {
    return await apiClient.get('/super-admin/storage');
}

async function fetchExactStorageUsage() {
    return await apiClient.get('/super-admin/storage/exact');
}

// ─── Backups ──────────────────────────────────────────────────────────────────

async function fetchBackups() {
    return await apiClient.get('/super-admin/backups');
}

async function createBackup() {
    return await apiClient.post('/super-admin/backups/create', {});
}

async function restoreBackup(backupId, confirmationPhrase) {
    return await apiClient.post('/super-admin/backups/restore', { backupId, confirmationPhrase });
}

// ─── Integrations ─────────────────────────────────────────────────────────────

async function fetchIntegrations() {
    return await apiClient.get('/super-admin/integrations');
}

// ─── Academic Institutions: Universities ──────────────────────────────────────
// NOTE: spec defines these under /admin/... (not /super-admin/...) — confirm with backend.

async function createUniversity(nameAr, nameEn, country) {
    // Backend model uses ArabicName/EnglishName, not the nameAr/nameEn shown in the spec doc.
    return await apiClient.post('/admin/universities', { arabicName: nameAr, englishName: nameEn, country });
}

async function fetchUniversities() {
    return await apiClient.get('/admin/universities');
}

// ─── Academic Institutions: Faculties ──────────────────────────────────────────

async function createFaculty(universityId, nameAr, nameEn, code, isActive = true) {
    // Same ArabicName/EnglishName naming as universities — see createUniversity().
    return await apiClient.post('/admin/faculties', { universityId, arabicName: nameAr, englishName: nameEn, code, isActive });
}

async function fetchFaculties(universityId = '') {
    const query = universityId ? `?universityId=${encodeURIComponent(universityId)}` : '';
    return await apiClient.get(`/admin/faculties${query}`);
}

// ─── Faculty Deans ──────────────────────────────────────────────────────────────

async function createDean(payload) {
    // payload: { name, email, password, academicTitle, facultyId, phone, office, appointmentDate }
    return await apiClient.post('/admin/deans', payload);
}

async function fetchDeans() {
    return await apiClient.get('/admin/deans');
}

async function updateDeanStatus(id, isActive, reason = '') {
    return await apiClient.put(`/admin/deans/${id}/status`, { isActive, reason });
}

async function resetDeanPassword(id, newPassword) {
    return await apiClient.post(`/admin/deans/${id}/reset-password`, { newPassword });
}
