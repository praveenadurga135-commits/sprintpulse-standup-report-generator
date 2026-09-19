import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export interface GroqConfig {
  apiKey: string;
  model: string;
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

async function readRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function callGroqChat(systemPrompt: string, userPrompt: string, config: GroqConfig): Promise<any> {
  if (!config.apiKey) {
    throw new Error('GROQ_API_KEY is not configured in server environment');
  }

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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const result: any = await response.json();
  const rawText = result?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('Groq returned empty response content');
  }

  return JSON.parse(rawText);
}

export async function handleGenerateSummary(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const config = getGroqConfig();
    const payload = await readRequestBody(req);
    const { project, sprint, updates = [], blockers = [] } = payload;

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

    const userPrompt = `Project: ${project?.name || 'Current Project'}
Sprint: ${sprint?.name || 'Active Sprint'} (Dates: ${sprint?.startDate || 'N/A'} to ${sprint?.endDate || 'N/A'})
Sprint Goal: ${sprint?.goal || 'Deliver scheduled sprint backlog items'}

Reported Daily Standup Updates (${updates.length} total):
${JSON.stringify(updates, null, 2)}

Identified Blockers (${blockers.length} total):
${JSON.stringify(blockers, null, 2)}

Please synthesize the sprint summary in the required JSON format.`;

    const generated = await callGroqChat(systemPrompt, userPrompt, config);
    sendJson(res, 200, { success: true, data: generated, model: config.model });
  } catch (error: any) {
    console.error('[GroqProxy] Error in handleGenerateSummary:', error?.message);
    sendJson(res, 500, { success: false, error: error?.message || 'Failed to generate sprint summary' });
  }
}

export async function handleGenerateReport(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const config = getGroqConfig();
    const payload = await readRequestBody(req);
    const { project, sprint, updates = [], blockers = [] } = payload;

    const systemPrompt = `You are an executive engineering intelligence assistant. Your task is to generate an executive Stakeholder Progress Report based strictly on the provided real standup updates, blockers, and sprint details.

CRITICAL ACCURACY CONSTRAINTS:
1. Ground every single claim in the provided project data.
2. DO NOT invent facts, achievements, metrics, risks, or blockers.
3. If information is missing, state that it was not reported.
4. DO NOT mention "AI", "LLM", "Groq", "GPT", "OpenAI", "model", or any internal technology names. Use executive, non-technical leadership phrasing.
5. Return a strictly valid JSON object matching this structure:
{
  "sprintStatus": "On Track" | "Needs Attention" | "At Risk",
  "executiveSummary": "executive overview paragraph",
  "keyAchievements": ["achievement 1", "achievement 2"],
  "currentProgress": [
    { "metric": "Sprint Status", "value": "On Track | Needs Attention | At Risk", "status": "positive" | "warning" },
    { "metric": "Updates Logged", "value": "X Updates", "status": "positive" | "neutral" },
    { "metric": "Impediments Resolved", "value": "X of Y", "status": "positive" | "neutral" },
    { "metric": "Active Blockers", "value": "X Active", "status": "positive" | "warning" }
  ],
  "keyRisks": ["risk 1", "risk 2"],
  "blockers": ["blocker description 1", "blocker description 2"],
  "nextSteps": ["milestone 1", "milestone 2"]
}`;

    const userPrompt = `Project: ${project?.name || 'Current Project'}
Sprint: ${sprint?.name || 'Active Sprint'} (Dates: ${sprint?.startDate || 'N/A'} to ${sprint?.endDate || 'N/A'})

Reported Daily Standup Updates (${updates.length} total):
${JSON.stringify(updates, null, 2)}

Identified Blockers (${blockers.length} total):
${JSON.stringify(blockers, null, 2)}

Please generate the executive stakeholder progress report in the required JSON format.`;

    const generated = await callGroqChat(systemPrompt, userPrompt, config);
    sendJson(res, 200, { success: true, data: generated, model: config.model });
  } catch (error: any) {
    console.error('[GroqProxy] Error in handleGenerateReport:', error?.message);
    sendJson(res, 500, { success: false, error: error?.message || 'Failed to generate stakeholder report' });
  }
}

export async function handleLlmStatus(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const config = getGroqConfig();
  sendJson(res, 200, {
    configured: Boolean(config.apiKey && config.apiKey.trim().length > 0),
    model: config.model,
  });
}