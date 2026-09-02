/**
 * AI Advisor Service (Track 03 - AI Revenue Recovery)
 * 
 * Invoked ONLY when rule-based confidence < 0.80 or for unclassified/unknown failure codes.
 * Returns structured recommendations with confidence scores and business explanations.
 * 
 * CRITICAL SAFETY BOUNDARY:
 * The AI Advisor NEVER decides status and NEVER executes actions directly.
 * It recommends — the deterministic policy engine decides ALLOWED or BLOCKED.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Consult the AI Advisor for recovery strategy recommendations.
 * @param {Object} payment - Payment transaction record
 * @param {Object} ruleDiagnosis - Baseline rule diagnosis from diagnosis.js
 * @returns {Promise<Object>} AI recovery recommendation
 */
async function consultLLM(payment, ruleDiagnosis = {}) {
  const prompt = `You are a financial recovery intelligence agent analyzing a failed subscription transaction.
Transaction Context:
- Payment ID: ${payment.id || 'unknown'}
- Customer: ${payment.customer_name || 'Customer'}
- Amount: INR ${(payment.amount || 0).toLocaleString('en-IN')}
- Failure Code: ${payment.failure_code || 'UNSPECIFIED'}
- Raw Failure Reason: ${payment.failure_reason || 'None provided'}
- Attempt Count: ${payment.attempt_number || 1}
- Rule Engine Guess: ${ruleDiagnosis.cause || 'unknown'} (Confidence: ${ruleDiagnosis.confidence || 0.5})

Available Playbook Actions:
- "schedule_smart_retry": For transient balance/timing issues (cooldown 4h-8h).
- "send_update_payment_link": When card expired or needs manual 3DS authorization.
- "immediate_retry": For transient gateway network blips on attempt 1.
- "escalate_alternate_method": When instrument is permanently blocked; request UPI/NetBanking.
- "manual_review": For high-value risk declines, fraud flags, or unknown unmapped errors.

Respond with strict JSON only:
{
  "recommended_action": "one of the available playbook actions",
  "confidence": number between 0.50 and 0.95,
  "business_explanation": "One clear paragraph explaining financial rationale and customer impact",
  "technical_rationale": "Brief note on root-cause hypothesis"
}`;

  // If Gemini API Key is available, call Google Gemini REST API
  if (GEMINI_API_KEY) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            recommended_action: parsed.recommended_action || 'manual_review',
            confidence: Number(parsed.confidence) || 0.75,
            business_explanation: parsed.business_explanation || 'AI evaluated transaction context.',
            technical_rationale: parsed.technical_rationale || 'Evaluated via Gemini 1.5 Flash',
            model_used: 'gemini-1.5-flash',
            is_live_llm: true
          };
        }
      }
    } catch (err) {
      console.warn('Live Gemini API call failed, falling back to local contextual advisor:', err.message);
    }
  }

  // If OpenAI API Key is available, call OpenAI chat completions API
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an autonomous revenue recovery intelligence agent. Output strict JSON only.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            recommended_action: parsed.recommended_action || 'manual_review',
            confidence: Number(parsed.confidence) || 0.75,
            business_explanation: parsed.business_explanation || 'AI evaluated transaction context.',
            technical_rationale: parsed.technical_rationale || 'Evaluated via GPT-4o-mini',
            model_used: 'gpt-4o-mini',
            is_live_llm: true
          };
        }
      }
    } catch (err) {
      console.warn('Live OpenAI API call failed, falling back to local contextual advisor:', err.message);
    }
  }

  // Contextual Semantic Heuristic Fallback (deterministic LLM-proxy when no API keys are mounted)
  return fallbackContextualAdvisor(payment, ruleDiagnosis);
}

/**
 * Contextual heuristic advisor providing deterministic, business-grade recovery recommendations
 * for ambiguous or low-confidence failure scenarios when external LLM credentials are not configured.
 */
function fallbackContextualAdvisor(payment, ruleDiagnosis) {
  const code = String(payment.failure_code || '').toUpperCase();
  const reason = String(payment.failure_reason || '').toLowerCase();
  const amount = Number(payment.amount || 0);
  const attempt = Number(payment.attempt_number || 1);

  // High-value transaction safeguard (> ₹25,000)
  if (amount >= 25000 && (code.includes('RISK') || code.includes('ANOMALY') || code.includes('FRAUD'))) {
    return {
      recommended_action: 'manual_review',
      confidence: 0.72,
      business_explanation: `High-value subscription (₹${amount.toLocaleString('en-IN')}) flagged with ambiguous risk code [${code}]. Recommending human finance ops intervention to safeguard revenue and avoid customer churn.`,
      technical_rationale: 'High capital value combined with issuer risk variance triggers executive ops review.',
      model_used: 'embedded-recovery-advisor-v1',
      is_live_llm: false
    };
  }

  // Routing / Gateway / Transient Anomaly
  if (code.includes('ROUTING') || code.includes('ANOMALY') || code.includes('TIMEOUT') || reason.includes('gateway') || reason.includes('network')) {
    const action = attempt === 1 ? 'immediate_retry' : 'schedule_smart_retry';
    return {
      recommended_action: action,
      confidence: 0.82,
      business_explanation: `Transient acquirer switch anomaly detected for ${payment.customer_name || 'customer'}. Recommending ${action === 'immediate_retry' ? 'immediate secondary rail retry' : 'smart retry window'} before disturbing customer.`,
      technical_rationale: 'Telemetry indicates transient network/switch desynchronization, high probability of auto-settlement.',
      model_used: 'embedded-recovery-advisor-v1',
      is_live_llm: false
    };
  }

  // Issuer Rejection / Ambiguous Account State
  if (code.includes('ISSUER_REJECTION') || code.includes('UNMAPPED') || reason.includes('issuer') || reason.includes('refused')) {
    return {
      recommended_action: 'send_update_payment_link',
      confidence: 0.85,
      business_explanation: `Issuing bank returned ambiguous refusal code [${code}]. Recommending automated WhatsApp/SMS payment update link to allow cardholder self-remediation.`,
      technical_rationale: 'Unmapped issuer decline typically requires cardholder step-up or alternative payment method entry.',
      model_used: 'embedded-recovery-advisor-v1',
      is_live_llm: false
    };
  }

  // General unclassified fallback
  return {
    recommended_action: 'manual_review',
    confidence: 0.65,
    business_explanation: `Unclassified payment failure (${code || 'NO_CODE'}) with low certainty. Routing to operational recovery queue per safety stopping rules.`,
    technical_rationale: 'Confidence below 0.80 threshold; automated execution halted.',
    model_used: 'embedded-recovery-advisor-v1',
    is_live_llm: false
  };
}

module.exports = {
  consultLLM
};
