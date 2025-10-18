class SpamDetector {
    constructor(config = {}) {
        // Rate limiting: max messages per time window
        this.rateLimits = new Map(); // userId -> {messages: [timestamp], count: number}
        this.maxMessagesPerMinute = config.maxMessagesPerMinute || 3;
        this.maxMessagesPerHour = config.maxMessagesPerHour || 10;
        this.maxMessagesPerDay = config.maxMessagesPerDay || 30;
        this.cooldownSeconds = config.cooldownSeconds || 2;
        this.detectionThreshold = config.detectionThreshold || 30;

        // Suspicious patterns (less aggressive for human-like behavior)
        this.suspiciousPatterns = [
            /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi, // URLs
            /\b(?:buy now|sell|discount|offer|deal|promo|free.*money|win.*prize|click.*here|subscribe.*now|join.*now|limited.*time|act.*now)\b/gi, // More specific sales phrases
            /\b(?:\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g, // Phone numbers
            /([a-zA-Z])\1{5,}/g, // More repeated characters (aaaaaa, lolllllll)
            /(?:\b[a-zA-Z]\b\s*){20,}/g, // More short words threshold
            /(?:.{1,2}\s*){25,}/g, // More very short characters threshold
        ];

        // Blacklisted words (more targeted)
        this.blacklistedWords = [
            'spam', 'scam', 'hack', 'virus', 'malware', 'phishing',
            'guaranteed.*return', 'risk.*free', 'act.*now.*limited', 'winner.*congratulations',
            'lottery.*winner', 'click.*bait', 'fake.*news', 'misinformation'
        ];

        // User reputation
        this.userReputation = new Map(); // userId -> {score: number, reports: number}

        // Recently seen messages for pattern detection
        this.recentMessages = [];
        this.maxRecentMessages = 100;

        // Cooldown periods
        this.cooldowns = new Map(); // userId -> timestamp

        console.log('🛡️ Spam detection initialized');
    }

    detectSpam(message) {
        const userId = message.from;
        const content = message.content || message.body || message.text || '';

        if (!userId || !content) {
            return { isSpam: false, reason: 'Invalid message' };
        }

        const result = {
            isSpam: false,
            reason: '',
            score: 0,
            risk: 'low'
        };

        // 1. Rate limiting check
        const rateLimitResult = this.checkRateLimit(userId, message.timestamp || Date.now());
        if (rateLimitResult.isSpam) {
            result.isSpam = true;
            result.reason = rateLimitResult.reason;
            result.score += rateLimitResult.score;
            result.risk = 'high';
            return result;
        }

        // 2. Cooldown check
        const cooldownResult = this.checkCooldown(userId, message.timestamp || Date.now());
        if (cooldownResult.isSpam) {
            result.isSpam = true;
            result.reason = cooldownResult.reason;
            result.score += cooldownResult.score;
            result.risk = 'high';
            return result;
        }

        // 3. Content pattern analysis
        const patternResult = this.analyzePatterns(content, userId);
        if (patternResult.isSpam) {
            result.isSpam = true;
            result.reason = patternResult.reason;
            result.score += patternResult.score;
            if (result.score >= 50) result.risk = 'high';
            else if (result.score >= 25) result.risk = 'medium';
        }

        // 4. User reputation check
        const reputationResult = this.checkReputation(userId);
        if (reputationResult.isSpam) {
            result.isSpam = true;
            result.reason += reputationResult.reason;
            result.score += reputationResult.score;
            if (result.score >= 50) result.risk = 'high';
            else if (result.score >= 25) result.risk = 'medium';
        }

        // 5. Message characteristics
        const charResult = this.analyzeCharacteristics(content);
        result.score += charResult.score;
        if (result.score >= 50) result.risk = 'high';
        else if (result.score >= 25) result.risk = 'medium';

        // Final decision
        result.isSpam = result.score >= this.detectionThreshold;

        // Log suspicious activity
        if (result.isSpam) {
            console.log(`🚫 SPAM DETECTED from ${userId}: ${result.reason} (score: ${result.score})`);
        } else if (result.score > 10) {
            console.log(`⚠️ Suspicious message from ${userId}: ${result.reason} (score: ${result.score})`);
        }

        return result;
    }

    checkRateLimit(userId, timestamp) {
        const now = timestamp;
        const userLimits = this.rateLimits.get(userId) || {
            minute: [],
            hour: [],
            day: []
        };

        // Clean old timestamps
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        userLimits.minute = userLimits.minute.filter(t => t > oneMinuteAgo);
        userLimits.hour = userLimits.hour.filter(t => t > oneHourAgo);
        userLimits.day = userLimits.day.filter(t => t > oneDayAgo);

        // Check limits
        if (userLimits.minute.length >= this.maxMessagesPerMinute) {
            return {
                isSpam: true,
                reason: `Too many messages (${userLimits.minute.length}) in last minute`,
                score: 50
            };
        }

        if (userLimits.hour.length >= this.maxMessagesPerHour) {
            return {
                isSpam: true,
                reason: `Too many messages (${userLimits.hour.length}) in last hour`,
                score: 40
            };
        }

        if (userLimits.day.length >= this.maxMessagesPerDay) {
            return {
                isSpam: true,
                reason: `Too many messages (${userLimits.day.length}) in last day`,
                score: 30
            };
        }

        // Add current timestamp
        userLimits.minute.push(now);
        userLimits.hour.push(now);
        userLimits.day.push(now);

        this.rateLimits.set(userId, userLimits);
        return { isSpam: false };
    }

    checkCooldown(userId, timestamp) {
        const cooldown = this.cooldowns.get(userId);
        const cooldownMs = this.cooldownSeconds * 1000;
        if (cooldown && timestamp - cooldown < cooldownMs) {
            return {
                isSpam: true,
                reason: `Message sent too quickly (cooldown period: ${this.cooldownSeconds}s)`,
                score: 30
            };
        }

        this.cooldowns.set(userId, timestamp);
        return { isSpam: false };
    }

    analyzePatterns(content, userId) {
        let score = 0;
        let reasons = [];

        const lowerContent = content.toLowerCase();

        // Check suspicious patterns (reduced scoring)
        for (const pattern of this.suspiciousPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                score += 15; // Reduced from 20
                reasons.push('Suspicious pattern detected');
            }
        }

        // Check blacklisted words (reduced scoring)
        for (const word of this.blacklistedWords) {
            if (lowerContent.includes(word)) {
                score += 20; // Reduced from 30
                reasons.push(`Blacklisted word: ${word}`);
            }
        }

        // Check for excessive capitalization
        const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (upperCaseRatio > 0.7 && content.length > 10) {
            score += 15;
            reasons.push('Excessive capitalization');
        }

        // Check for excessive punctuation
        const punctuationRatio = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / content.length;
        if (punctuationRatio > 0.3) {
            score += 15;
            reasons.push('Excessive punctuation');
        }

        // Check for repeated messages
        this.recentMessages.push({ userId, content, timestamp: Date.now() });
        if (this.recentMessages.length > this.maxRecentMessages) {
            this.recentMessages.shift();
        }

        // Check for identical recent messages
        const recentFromUser = this.recentMessages
            .filter(msg => msg.userId === userId && msg.content === content)
            .slice(-3);

        if (recentFromUser.length >= 2) {
            score += 40;
            reasons.push('Repeated message');
        }

        return {
            isSpam: score >= 30,
            reason: reasons.join(', '),
            score
        };
    }

    analyzeCharacteristics(content) {
        let score = 0;

        // Very short messages might be spam
        if (content.length < 3 && content.trim()) {
            score += 10;
        }

        // Very long messages might be spam
        if (content.length > 1000) {
            score += 10;
        }

        // Messages with only special characters
        if (!/[a-zA-Z0-9]/.test(content)) {
            score += 25;
        }

        // Messages with suspicious character patterns
        if (/(.)\1{4,}/.test(content)) { // 5+ repeated characters
            score += 15;
        }

        return { score };
    }

    checkReputation(userId) {
        const reputation = this.userReputation.get(userId) || { score: 100, reports: 0 };

        if (reputation.score < 0) {
            return {
                isSpam: true,
                reason: `Poor user reputation (score: ${reputation.score})`,
                score: Math.abs(reputation.score)
            };
        }

        if (reputation.reports > 0) {
            return {
                isSpam: false,
                reason: `User has ${reputation.reports} reports`,
                score: reputation.reports * 10
            };
        }

        return { isSpam: false, score: 0 };
    }

    // Add or update user reputation
    updateReputation(userId, scoreChange, reason = '') {
        const reputation = this.userReputation.get(userId) || { score: 100, reports: 0 };
        reputation.score += scoreChange;

        if (reason.includes('report')) {
            reputation.reports++;
        }

        // Ensure score doesn't go below -100
        reputation.score = Math.max(-100, reputation.score);

        this.userReputation.set(userId, reputation);
        console.log(`📊 Updated reputation for ${userId}: ${reputation.score} (${reason})`);
    }

    // Report a user for spam
    reportUser(userId, reporterId) {
        this.updateReputation(userId, -20, `Reported by ${reporterId}`);
    }

    // Cleanup old data
    cleanup() {
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

        // Clean old rate limits
        for (const [userId, limits] of this.rateLimits.entries()) {
            if (limits.day.length === 0 && limits.hour.length === 0 && limits.minute.length === 0) {
                this.rateLimits.delete(userId);
            }
        }

        // Clean old cooldowns
        for (const [userId, timestamp] of this.cooldowns.entries()) {
            if (now - timestamp > 60000) { // 1 minute
                this.cooldowns.delete(userId);
            }
        }

        // Clean old reputation data
        for (const [userId, reputation] of this.userReputation.entries()) {
            if (reputation.score === 100 && reputation.reports === 0) {
                // Don't clean neutral users
                continue;
            }
            // Could implement time-based reputation recovery here
        }
    }
}

module.exports = SpamDetector;