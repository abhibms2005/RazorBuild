/**
 * Diagnosis Engine for Failed Payments
 * Analyzes failure codes, messages, and transaction context
 * to classify the root cause with calibrated confidence scores.
 * 
 * Includes deterministic fast-path CAUSE_MAP and asynchronous
 * AI Advisor consultation for low-confidence (<0.80) / unclassified events.
 */

const { consultLLM } = require('./aiAdvisor.js');

const CAUSE_MAP = {
  insufficient_funds: {
    codes: [
      'INSUFFICIENT_FUNDS',
      'BAD_REQUEST_INSUFFICIENT_FUNDS',
      'payment_failed_insufficient_funds',
      'ERR_INSUFFICIENT_FUNDS',
      'LOW_BALANCE'
    ],
    keywords: ['insufficient', 'low balance', 'not enough funds', 'balance'],
    confidence: 0.95,
    retryEligible: true,
    explanation: 'Cardholder account balance insufficient at settlement time'
  },
  card_expired: {
    codes: [
      'CARD_EXPIRED',
      'EXPIRED_CARD',
      'BAD_REQUEST_PAYMENT_CARD_EXPIRED',
      'ERR_CARD_EXPIRED'
    ],
    keywords: ['expired', 'validity expired', 'card expiry'],
    confidence: 0.98,
    retryEligible: false,
    explanation: 'Card expiration date passed validity period'
  },
  bank_technical_error: {
    codes: [
      'GATEWAY_ERROR',
      'BANK_ERROR',
      'INTERNAL_SERVER_ERROR',
      'ISSUER_DOWN',
      'NETWORK_TIMEOUT',
      'GATEWAY_TIMEOUT',
      'ERR_NETWORK'
    ],
    keywords: ['technical', 'gateway', 'timeout', 'timed out', 'network', 'issuer down', 'server error'],
    confidence: 0.90,
    retryEligible: true,
    explanation: 'Transient gateway network or issuer connectivity timeout'
  },
  risk_decline: {
    codes: [
      'RISK_DECLINE',
      'FRAUD_DETECTED',
      'SUSPECTED_FRAUD',
      'SECURITY_VIOLATION',
      'DO_NOT_HONOUR',
      'DECLINED_BY_RISK'
    ],
    keywords: ['risk', 'fraud', 'security', 'do not honour', 'declined by bank policy', 'declined by issuer risk'],
    confidence: 0.75, // Below 0.80 threshold -> triggers AI consult & manual review
    retryEligible: false,
    explanation: 'Issuer risk scoring flagged transaction for manual verification'
  },
  authentication_failed: {
    codes: [
      'AUTH_FAILED',
      'OTP_FAILED',
      '3DS_FAILED',
      'USER_DROPPED',
      'AUTHENTICATION_ERROR',
      'STEP_UP_FAILED'
    ],
    keywords: ['otp', 'authentication', '3ds', '3d secure', 'verification failed', 'user dropped'],
    confidence: 0.88,
    retryEligible: false,
    explanation: 'Customer failed 3D Secure / OTP step-up authentication'
  },
  card_blocked: {
    codes: [
      'CARD_BLOCKED',
      'LOST_CARD',
      'STOLEN_CARD',
      'HOTLISTED_CARD',
      'RESTRICTED_CARD'
    ],
    keywords: ['card blocked', 'hotlisted', 'stolen', 'lost card', 'restricted'],
    confidence: 0.99,
    retryEligible: false,
    explanation: 'Card reported lost, stolen, or frozen by issuing bank'
  },
  limit_exceeded: {
    codes: [
      'LIMIT_EXCEEDED',
      'MAX_AMOUNT_EXCEEDED',
      'VELOCITY_CHECK_FAILED',
      'DAILY_LIMIT_REACHED'
    ],
    keywords: ['limit exceeded', 'limit', 'velocity', 'daily limit'],
    confidence: 0.92,
    retryEligible: false,
    explanation: 'Transaction amount exceeds cardholder single or daily velocity limit'
  }
};

/**
 * Fast synchronous deterministic diagnosis
 * @param {Object} payment - Payment record
 * @returns {Object} Diagnosis outcome
 */
function diagnose(payment) {
  if (!payment) {
    return {
      cause: 'unknown_failure',
      confidence: 0.50,
      retryEligible: false,
      explanation: 'Missing payment record for diagnosis',
      reason: 'no_record'
    };
  }

  const rawCode = String(payment.failure_code || '').trim().toUpperCase();
  const rawReason = String(payment.failure_reason || '').trim().toLowerCase();

  // Search each cause in CAUSE_MAP
  for (const [causeKey, causeDef] of Object.entries(CAUSE_MAP)) {
    // Exact or partial match on failure codes
    const codeMatch = rawCode && causeDef.codes.some(c => rawCode === c || rawCode.includes(c));
    
    // Keyword match on failure reason message
    const reasonMatch = rawReason && causeDef.keywords.some(kw => rawReason.includes(kw));

    if (codeMatch || reasonMatch) {
      return {
        cause: causeKey,
        confidence: causeDef.confidence,
        retryEligible: causeDef.retryEligible,
        explanation: causeDef.explanation,
        reason: causeKey,
        isAiDiagnosed: false
      };
    }
  }

  // Fallback for unclassified failures
  return {
    cause: 'unknown_failure',
    confidence: 0.55,
    retryEligible: false,
    explanation: payment.failure_reason || 'Unclassified failure code or missing reason',
    reason: payment.failure_code || 'unknown',
    isAiDiagnosed: false
  };
}

/**
 * Asynchronous diagnosis pipeline with LLM Advisor integration
 * Uses deterministic CAUSE_MAP first; if confidence < 0.80 or unknown cause,
 * consults AI Advisor for contextual analysis.
 * 
 * @param {Object} payment - Payment record
 * @returns {Promise<Object>} Enriched diagnosis outcome
 */
async function diagnoseAsync(payment) {
  const ruleResult = diagnose(payment);

  // Invoke AI advisor ONLY when rule confidence < 0.80 OR cause is unknown_failure
  if (ruleResult.confidence < 0.80 || ruleResult.cause === 'unknown_failure') {
    try {
      const aiResponse = await consultLLM(payment, ruleResult);
      return {
        ...ruleResult,
        isAiDiagnosed: true,
        aiRecommendation: aiResponse,
        explanation: aiResponse.business_explanation || ruleResult.explanation,
        // AI proposed confidence is factored into diagnostic context
        aiConfidence: aiResponse.confidence
      };
    } catch (err) {
      console.warn('AI Advisor consultation failed:', err.message);
      return {
        ...ruleResult,
        isAiDiagnosed: false,
        aiError: err.message
      };
    }
  }

  return ruleResult;
}

module.exports = {
  CAUSE_MAP,
  diagnose,
  diagnoseAsync
};
