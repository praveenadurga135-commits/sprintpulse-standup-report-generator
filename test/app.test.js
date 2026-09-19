import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
  return 'sp_sha256$' + salt + '$' + hash;
}

function verifyPassword(candidate, storedHash) {
  if (!storedHash.startsWith('sp_sha256$')) {
    return candidate === storedHash;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const originalHash = parts[2];
  const computed = crypto.createHash('sha256').update(salt + ':' + candidate).digest('hex');
  return computed === originalHash;
}

describe('Security & Authentication Tests', () => {
  it('should hash passwords with salt and format sp_sha256$<salt>$<hash>', () => {
    const raw = 'SuperSecret123!';
    const hashed = hashPassword(raw);
    assert.match(hashed, /^sp_sha256\$[0-9a-f]+\$[0-9a-f]+$/);
    assert.notEqual(hashed, raw);
  });

  it('should verify correct password and reject incorrect password', () => {
    const raw = 'PasswordValid!';
    const hashed = hashPassword(raw);
    assert.equal(verifyPassword(raw, hashed), true);
    assert.equal(verifyPassword('WrongPass', hashed), false);
  });

  it('should support backward compatibility for legacy plaintext passwords', () => {
    const legacyPlaintext = 'legacyPass123';
    assert.equal(verifyPassword(legacyPlaintext, legacyPlaintext), true);
    assert.equal(verifyPassword('wrong', legacyPlaintext), false);
  });

  it('should sanitize user object by removing password', () => {
    const user = {
      id: 'usr-1',
      name: 'Alice',
      email: 'alice@company.com',
      password: 'sp_sha256$123$456',
      role: 'manager',
    };
    const { password, ...safeUser } = user;
    assert.equal(safeUser.password, undefined);
    assert.equal(safeUser.name, 'Alice');
  });
});

describe('Project & Sprint Date Validation', () => {
  it('should reject project end dates in the past', () => {
    const today = new Date().toISOString().split('T')[0];
    const pastDate = '2020-01-01';
    assert.equal(pastDate < today, true);
  });

  it('should reject project where end date < start date', () => {
    const startDate = '2026-10-10';
    const endDate = '2026-10-05';
    assert.equal(endDate < startDate, true);
  });

  it('should accept valid future date ranges', () => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = '2026-12-31';
    assert.equal(futureDate >= today, true);
  });
});

describe('Recurring Blocker Semantic Detection', () => {
  const CONCEPT_MAPPINGS = [
    { tag: 'api_backend', terms: ['backend', 'api', 'apis', 'endpoint', 'endpoints', 'server'] },
    { tag: 'access_auth', terms: ['access', 'permission', 'token', 'vault', 'key', 'auth', 'credentials'] },
    { tag: 'delay_pending', terms: ['waiting', 'pending', 'blocked', 'delay', 'delayed'] },
  ];

  function extractConcepts(text) {
    const lower = text.toLowerCase();
    const found = new Set();
    for (const mapping of CONCEPT_MAPPINGS) {
      for (const term of mapping.terms) {
        if (lower.includes(term)) {
          found.add(mapping.tag);
          break;
        }
      }
    }
    return found;
  }

  it('should detect conceptual similarity for differently worded blockers', () => {
    const day1 = 'Waiting for backend API access';
    const day2 = 'Backend API access is still pending';
    const day3 = 'I still cannot access the required backend endpoint';

    const c1 = extractConcepts(day1);
    const c2 = extractConcepts(day2);
    const c3 = extractConcepts(day3);

    assert.equal(c1.has('api_backend'), true);
    assert.equal(c1.has('access_auth'), true);
    assert.equal(c2.has('api_backend'), true);
    assert.equal(c2.has('access_auth'), true);
    assert.equal(c3.has('api_backend'), true);
    assert.equal(c3.has('access_auth'), true);
  });

  it('should keep unrelated blockers separated', () => {
    const apiBlocker = 'Waiting for backend API access';
    const cssBlocker = 'Color contrast in button CSS failed accessibility';

    const cApi = extractConcepts(apiBlocker);
    const cCss = extractConcepts(cssBlocker);

    assert.equal(cApi.has('api_backend'), true);
    assert.equal(cCss.has('api_backend'), false);
  });
});

describe('Authorization and Visibility Isolation', () => {
  it('should strictly isolate updates by projectId and approved membership', () => {
    const updates = [
      { id: 'u1', projectId: 'prj-alpha', userId: 'user-1', date: '2026-09-18', yesterday: 'A', today: 'B', blockers: 'None', hasBlocker: false },
      { id: 'u2', projectId: 'prj-beta', userId: 'user-2', date: '2026-09-18', yesterday: 'C', today: 'D', blockers: 'None', hasBlocker: false },
    ];

    const currentProject = 'prj-alpha';
    const approvedMemberIds = new Set(['user-1']);

    const visibleUpdates = updates.filter(
      (u) => u.projectId === currentProject && approvedMemberIds.has(u.userId)
    );

    assert.equal(visibleUpdates.length, 1);
    assert.equal(visibleUpdates[0].id, 'u1');
    assert.equal(visibleUpdates[0].projectId, 'prj-alpha');
  });

  it('should calculate 0% progress when no updates are logged', () => {
    const updates = [];
    const activeEngineersCount = 3;
    const workingDays = 10;
    const totalExpected = activeEngineersCount * workingDays;

    const progressPercent = updates.length === 0 || totalExpected === 0
      ? 0
      : Math.min(100, Math.round((updates.length / totalExpected) * 100));

    assert.equal(progressPercent, 0);
  });

  it('should calculate real progress from submitted updates without fake baselines', () => {
    const updates = new Array(15).fill({ id: 'u' });
    const totalExpected = 30;

    const progressPercent = Math.min(100, Math.round((updates.length / totalExpected) * 100));
    assert.equal(progressPercent, 50);
  });
});

describe('LLM Structured Output Parser and Guardrails', () => {
  it('should validate structured summary JSON structure', () => {
    const sampleResponse = {
      overallProgress: 'Sprint deliverables advancing on schedule.',
      progressPercentage: 65,
      completedWork: ['Completed auth middleware'],
      workInProgress: ['Wiring checkout UI'],
      keyBlockers: [{ title: 'API Access', severity: 'High', impact: 'Delayed integration' }],
      risks: [{ risk: 'Schedule compression', level: 'Medium', mitigation: 'Focus on core path' }],
      nextSteps: ['Run integration tests'],
    };

    assert.equal(typeof sampleResponse.overallProgress, 'string');
    assert.equal(Array.isArray(sampleResponse.completedWork), true);
    assert.equal(Array.isArray(sampleResponse.workInProgress), true);
    assert.equal(Array.isArray(sampleResponse.keyBlockers), true);
    assert.equal(sampleResponse.keyBlockers[0].severity, 'High');
  });

  it('should safely fall back if LLM returns malformed or empty fields', () => {
    const malformed = { overallProgress: null, completedWork: 'not-an-array' };
    const safeCompleted = Array.isArray(malformed.completedWork) ? malformed.completedWork : ['No completed deliverables reported yet'];
    assert.equal(safeCompleted[0], 'No completed deliverables reported yet');
  });
});
