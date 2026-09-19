import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface GroqConfig {
  apiKey: string;
  model: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    retryAfter?: number;
  };
}

export function getGroqConfig(): GroqConfig {
  let apiKey = process.env.GROQ_API_KEY || '';
  let model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  if (!apiKey) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('GROQ_API_KEY=')) {
            apiKey = trimmed.slice('GROQ_API_KEY='.length).replace(/^["']|["']$/g, '').trim();
          } else if (trimmed.startsWith('GROQ_MODEL=')) {
            model = trimmed.slice('GROQ_MODEL='.length).replace(/^["']|["']$/g, '').trim();
          }
        }
      }
    } catch (e) {
      console.warn('[GroqProxy] Could not read .env file:', e);
    }
  }

  return { apiKey, model };
}

async function readRequestBody(req: IncomingMessage, maxBytes: number = 2 * 1024 * 1024): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesRead = 0;

    req.on('data', (chunk) => {
      bytesRead += chunk.length;
      if (bytesRead > maxBytes) {
        req.destroy();
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}

function sendApiError(
  res: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  retryable: boolean = false,
  retryAfter?: number
) {
  sendJson(res, statusCode, {
    success: false,
    error: {
      code,
      message,
      retryable,
      ...(retryAfter ? { retryAfter } : {}),
    },
  });
}

/**
 * Executes call to Groq with timeout, retry strategy for transient errors,
 * and structured error normalization.
 */
async function callGroqChat(
  systemPrompt: string,
  userPrompt: string,
  config: GroqConfig,
  timeoutMs: number = 25000
): Promise<any> {
  if (!config.apiKey) {
    const err: any = new Error('AI service is not configured.');
    err.code = 'AI_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }

  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle HTTP status codes
      if (!response.ok) {
        const status = response.status;
        let retryAfter: number | undefined;
        const retryHeader = response.headers.get('retry-after');
        if (retryHeader) {
          const parsed = parseInt(retryHeader, 10);
          if (!isNaN(parsed)) retryAfter = parsed;
        }

        if (status === 401 || status === 403) {
          const err: any = new Error('AI service authentication failed.');
          err.code = 'AI_AUTH_FAILED';
          err.status = 502;
          throw err;
        }

        if (status === 429) {
          const err: any = new Error('The AI service is temporarily rate limited. Please try again shortly.');
          err.code = 'AI_RATE_LIMITED';
          err.status = 429;
          err.retryable = true;
          err.retryAfter = retryAfter || 5;
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, (err.retryAfter || 2) * 1000));
            continue;
          }
          throw err;
        }

        if (status >= 500 && status < 600) {
          const err: any = new Error('Temporary AI service disruption. Please try again.');
          err.code = 'AI_UPSTREAM_ERROR';
          err.status = 502;
          err.retryable = true;
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
            continue;
          }
          throw err;
        }

        // Generic client error from upstream (e.g. 400 Bad Request)
        const err: any = new Error('Invalid generation request configuration.');
        err.code = 'INVALID_REQUEST';
        err.status = 400;
        throw err;
      }

      const result: any = await response.json();
      const rawText = result?.choices?.[0]?.message?.content;
      if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
        const err: any = new Error('The AI service returned an empty response.');
        err.code = 'AI_INVALID_RESPONSE';
        err.status = 502;
        throw err;
      }

      try {
        return JSON.parse(rawText);
      } catch {
        const err: any = new Error('The AI service returned malformed JSON.');
        err.code = 'AI_INVALID_RESPONSE';
        err.status = 502;
        throw err;
      }
    } catch (fetchErr: any) {
      clearTimeout(timer);
      if (fetchErr.name === 'AbortError') {
        const err: any = new Error('The AI request timed out. Please try again.');
        err.code = 'AI_TIMEOUT';
        err.status = 504;
        err.retryable = true;
        lastError = err;
      } else if (fetchErr.code && fetchErr.status) {
        lastError = fetchErr;
        if (!fetchErr.retryable) break;
      } else {
        const err: any = new Error('Unable to connect to AI service network.');
        err.code = 'AI_NETWORK_ERROR';
        err.status = 503;
        err.retryable = true;
        lastError = err;
      }

      if (attempt < maxAttempts && lastError.retryable) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('AI service request failed.');
}

export async function handleGenerateSummary(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const config = getGroqConfig();
    const payload = await readRequestBody(req);
    const { project, sprint, updates = [], blockers = [] } = payload;

    if (!project || !sprint) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Project and sprint contexts are required for summary generation.');
      return;
    }

    const systemPrompt = `You are an executive engineering intelligence assistant. Your task is to generate a concise, professional Sprint Summary based strictly on the provided real standup updates, blockers, and sprint details.

CRITICAL ACCURACY CONSTRAINTS:
1. Ground every single claim in the provided project data.
2. DO NOT invent facts, tasks, team members, achievements, dates, blockers, or metrics.
3. If no updates or deliverables were submitted for a category, explicitly state that none were reported (e.g. "No completed deliverables were reported in the submitted standup updates.").
4. DO NOT mention "AI", "LLM", "Groq", "GPT", "OpenAI", "model", or any internal technology names. Use professional engineering leadership phrasing.
5. Return a strictly valid JSON object matching this structure:
{
  "overallProgress": "concise narrative summary",
  "progressPercentage": <number between 0 and 100>,
  "completedWork": ["item 1", "item 2"],
  "workInProgress": ["item 1", "item 2"],
  "keyBlockers": [
    {
      "title": "short title",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "impact": "impact description"
    }
  ],
  "risks": [
    {
      "risk": "description of risk grounded in updates",
      "level": "Low" | "Medium" | "High" | "Critical",
      "mitigation": "recommended engineering action"
    }
  ],
  "nextSteps": ["actionable next step 1", "actionable next step 2"]
}`;

    const userPrompt = `Project: ${String(project?.name || '').slice(0, 100)}
Sprint: ${String(sprint?.name || '').slice(0, 100)} (Dates: ${sprint?.startDate || 'N/A'} to ${sprint?.endDate || 'N/A'})
Sprint Goal: ${String(sprint?.goal || '').slice(0, 300)}

Reported Daily Standup Updates (${Array.isArray(updates) ? updates.length : 0} total):
${JSON.stringify(Array.isArray(updates) ? updates.slice(0, 50) : [], null, 2)}

Identified Blockers (${Array.isArray(blockers) ? blockers.length : 0} total):
${JSON.stringify(Array.isArray(blockers) ? blockers.slice(0, 20) : [], null, 2)}

Please synthesize the sprint summary in the required JSON format.`;

    const generated = await callGroqChat(systemPrompt, userPrompt, config);
    sendJson(res, 200, { success: true, data: generated, model: config.model });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'Failed to generate sprint summary';
    const retryable = Boolean(error.retryable);
    sendApiError(res, status, code, message, retryable, error.retryAfter);
  }
}

export async function handleGenerateReport(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const config = getGroqConfig();
    const payload = await readRequestBody(req);
    const { project, sprint, updates = [], blockers = [] } = payload;

    if (!project || !sprint) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Project and sprint contexts are required for stakeholder report generation.');
      return;
    }

    const systemPrompt = `You are an executive engineering intelligence assistant. Your task is to generate an executive Stakeholder Progress Report based strictly on the provided real standup updates, blockers, and sprint details.

CRITICAL ACCURACY CONSTRAINTS:
1. Ground every single claim in the provided project data.
2. DO NOT invent facts, tasks, team members, achievements, dates, blockers, or metrics.
3. If no updates or deliverables were submitted for a category, explicitly state that none were reported.
4. Maintain a non-technical, polished tone suitable for VP/Director/Executive stakeholders.
5. DO NOT mention "AI", "LLM", "Groq", "GPT", "model", or any internal software stack components.
6. Return a strictly valid JSON object matching this structure:
{
  "sprintStatus": "On Track" | "At Risk" | "Needs Attention",
  "executiveSummary": "high-level executive briefing paragraph",
  "keyAchievements": ["major milestone 1", "major milestone 2"],
  "currentProgress": [
    { "metric": "Delivery Velocity", "value": "e.g. 85%", "status": "positive" | "warning" | "neutral" }
  ],
  "keyRisks": ["business/schedule risk 1"],
  "blockers": ["critical impediment description"],
  "nextSteps": ["upcoming key deliverable"]
}`;

    const userPrompt = `Project: ${String(project?.name || '').slice(0, 100)}
Sprint: ${String(sprint?.name || '').slice(0, 100)} (Dates: ${sprint?.startDate || 'N/A'} to ${sprint?.endDate || 'N/A'})
Sprint Goal: ${String(sprint?.goal || '').slice(0, 300)}

Reported Daily Standup Updates (${Array.isArray(updates) ? updates.length : 0} total):
${JSON.stringify(Array.isArray(updates) ? updates.slice(0, 50) : [], null, 2)}

Identified Blockers (${Array.isArray(blockers) ? blockers.length : 0} total):
${JSON.stringify(Array.isArray(blockers) ? blockers.slice(0, 20) : [], null, 2)}

Please generate the executive stakeholder progress report in the required JSON format.`;

    const generated = await callGroqChat(systemPrompt, userPrompt, config);
    sendJson(res, 200, { success: true, data: generated, model: config.model });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'Failed to generate stakeholder report';
    const retryable = Boolean(error.retryable);
    sendApiError(res, status, code, message, retryable, error.retryAfter);
  }
}

export async function handleLlmStatus(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const config = getGroqConfig();
  sendJson(res, 200, {
    configured: Boolean(config.apiKey && config.apiKey.trim().length > 0),
    model: config.model,
  });
}

export async function handleValidateProject(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const payload = await readRequestBody(req);
    const { name, startDate, endDate } = payload;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Project name must be at least 2 characters.');
      return;
    }
    if (name.length > 100) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Project name cannot exceed 100 characters.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (endDate < todayStr) {
      sendApiError(res, 400, 'INVALID_DATE', 'Project deadline cannot be in the past.');
      return;
    }
    if (endDate < startDate) {
      sendApiError(res, 400, 'INVALID_DATE', 'Project end date must be on or after start date.');
      return;
    }
    sendJson(res, 200, { valid: true });
  } catch (err: any) {
    sendApiError(res, 400, 'INVALID_PAYLOAD', err?.message || 'Invalid payload');
  }
}

export async function handleValidateSprint(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const payload = await readRequestBody(req);
    const { name, startDate, endDate } = payload;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Sprint name must be at least 2 characters.');
      return;
    }
    if (name.length > 100) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Sprint name cannot exceed 100 characters.');
      return;
    }
    if (endDate < startDate) {
      sendApiError(res, 400, 'INVALID_DATE', 'Sprint end date must be on or after start date.');
      return;
    }
    sendJson(res, 200, { valid: true });
  } catch (err: any) {
    sendApiError(res, 400, 'INVALID_PAYLOAD', err?.message || 'Invalid payload');
  }
}

export async function handleValidateStandup(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const payload = await readRequestBody(req);
    const { projectId, sprintId, userId, yesterday, today, blockers } = payload;
    if (!projectId || !sprintId || !userId) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Project, sprint, and user credentials required.');
      return;
    }
    const yLen = (yesterday || '').length;
    const tLen = (today || '').length;
    const bLen = (blockers || '').length;
    if (yLen > 5000 || tLen > 5000 || bLen > 5000) {
      sendApiError(res, 400, 'PAYLOAD_TOO_LARGE', 'Standup update content exceeds maximum allowed length.');
      return;
    }
    sendJson(res, 200, { valid: true });
  } catch (err: any) {
    sendApiError(res, 400, 'INVALID_PAYLOAD', err?.message || 'Invalid payload');
  }
}

export async function handleAuthHash(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const payload = await readRequestBody(req);
    const { password } = payload;
    if (!password || typeof password !== 'string') {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Password is required');
      return;
    }
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
    sendJson(res, 200, { hash: `sp_scrypt$${salt.toString('hex')}$${key.toString('hex')}` });
  } catch (err: any) {
    sendApiError(res, 500, 'INTERNAL_ERROR', err?.message || 'Hashing error');
  }
}

export async function handleAuthVerify(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const payload = await readRequestBody(req);
    const { candidate, storedHash } = payload;
    if (!candidate || !storedHash) {
      sendApiError(res, 400, 'INVALID_REQUEST', 'Candidate password and stored hash required');
      return;
    }
    if (storedHash.startsWith('sp_scrypt$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 3) {
        sendJson(res, 400, { valid: false, error: 'Malformed hash' });
        return;
      }
      const salt = Buffer.from(parts[1], 'hex');
      const originalKey = Buffer.from(parts[2], 'hex');
      const computed = crypto.scryptSync(candidate, salt, 32, { N: 16384, r: 8, p: 1 });
      const valid = computed.length === originalKey.length && crypto.timingSafeEqual(computed, originalKey);
      sendJson(res, 200, { valid });
      return;
    }
    if (storedHash.startsWith('sp_sha256$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 3) {
        sendJson(res, 400, { valid: false, error: 'Malformed hash' });
        return;
      }
      const salt = parts[1];
      const originalHash = parts[2];
      const computed = crypto.createHash('sha256').update(`${salt}:${candidate}`).digest('hex');
      const bufComputed = Buffer.from(computed);
      const bufOriginal = Buffer.from(originalHash);
      const valid = bufComputed.length === bufOriginal.length && crypto.timingSafeEqual(bufComputed, bufOriginal);
      sendJson(res, 200, { valid });
      return;
    }
    // legacy plaintext fallback with timing safe compare
    const a = Buffer.from(candidate);
    const b = Buffer.from(storedHash);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    sendJson(res, 200, { valid });
  } catch (err: any) {
    sendApiError(res, 500, 'INTERNAL_ERROR', err?.message || 'Verification error');
  }
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0] || '';
  if (req.method === 'POST' && url === '/api/generate-summary') {
    await handleGenerateSummary(req, res);
    return true;
  }
  if (req.method === 'POST' && url === '/api/generate-report') {
    await handleGenerateReport(req, res);
    return true;
  }
  if (req.method === 'GET' && url === '/api/llm-status') {
    await handleLlmStatus(req, res);
    return true;
  }
  if (req.method === 'POST' && url === '/api/validate-project') {
    await handleValidateProject(req, res);
    return true;
  }
  if (req.method === 'POST' && url === '/api/validate-sprint') {
    await handleValidateSprint(req, res);
    return true;
  }
  if (req.method === 'POST' && url === '/api/validate-standup') {
    await handleValidateStandup(req, res);
    return true;
  }
  if (req.method === 'POST' && url === '/api/auth/hash') {
    await handleAuthHash(req, res);
    return true;
  }
  if (req.method === 'POST' && url === '/api/auth/verify') {
    await handleAuthVerify(req, res);
    return true;
  }
  return false;
}
