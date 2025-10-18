const { Pool } = require('pg');

class StatusService {
    constructor(databaseService) {
        this.db = databaseService;
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.createStatusTables();
            this.initialized = true;
            console.log('✅ Status Service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Status Service initialization failed:', error);
            return false;
        }
    }

    async createStatusTables() {
        const createTablesQuery = `
            -- Status pekerjaan table
            CREATE TABLE IF NOT EXISTS status_pekerjaan (
                id SERIAL PRIMARY KEY,
                status_text TEXT NOT NULL,
                created_by VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_added DATE DEFAULT CURRENT_DATE,
                tags TEXT[]
            );

            -- Status logs untuk tracking perubahan
            CREATE TABLE IF NOT EXISTS status_logs (
                id SERIAL PRIMARY KEY,
                status_id INTEGER REFERENCES status_pekerjaan(id),
                action VARCHAR(50) NOT NULL,
                updated_by VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                old_values TEXT,
                new_values TEXT
            );

            -- AI processed status (untuk format yang sudah diproses AI)
            CREATE TABLE IF NOT EXISTS status_ai_processed (
                id SERIAL PRIMARY KEY,
                status_id INTEGER REFERENCES status_pekerjaan(id),
                original_text TEXT NOT NULL,
                formatted_text TEXT NOT NULL,
                processed_by VARCHAR(255) NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ai_model VARCHAR(100),
                is_final BOOLEAN DEFAULT false
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_status_pekerjaan_date ON status_pekerjaan(date_added);
            CREATE INDEX IF NOT EXISTS idx_status_pekerjaan_created_by ON status_pekerjaan(created_by);
            CREATE INDEX IF NOT EXISTS idx_status_pekerjaan_created_at ON status_pekerjaan(created_at);
            CREATE INDEX IF NOT EXISTS idx_status_logs_status_id ON status_logs(status_id);
            CREATE INDEX IF NOT EXISTS idx_status_ai_processed_status_id ON status_ai_processed(status_id);
        `;

        try {
            await this.db.pool.query(createTablesQuery);
            console.log('✅ Status tables created successfully');
        } catch (error) {
            console.error('❌ Error creating status tables:', error);
            throw error;
        }
    }

    // Add new status pekerjaan
    async addStatus(statusText, createdBy, tags = []) {
        if (!this.initialized) throw new Error('Status Service not initialized');

        const query = `
            INSERT INTO status_pekerjaan (status_text, created_by, tags)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [statusText, createdBy, tags];

        try {
            const result = await this.db.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding status:', error);
            throw error;
        }
    }

    // Get status pekerjaan for specific date (default today)
    async getStatusByDate(date = null) {
        if (!this.initialized) throw new Error('Status Service not initialized');

        const targetDate = date || new Date().toISOString().split('T')[0];

        const query = `
            SELECT * FROM status_pekerjaan
            WHERE date_added = $1
            ORDER BY created_at ASC
        `;

        try {
            const result = await this.db.pool.query(query, [targetDate]);
            return result.rows;
        } catch (error) {
            console.error('Error getting status by date:', error);
            throw error;
        }
    }

    // Get status pekerjaan for date range
    async getStatusByDateRange(startDate, endDate) {
        if (!this.initialized) throw new Error('Status Service not initialized');

        const query = `
            SELECT * FROM status_pekerjaan
            WHERE date_added >= $1 AND date_added <= $2
            ORDER BY date_added, created_at ASC
        `;

        try {
            const result = await this.db.pool.query(query, [startDate, endDate]);
            return result.rows;
        } catch (error) {
            console.error('Error getting status by date range:', error);
            throw error;
        }
    }

    // Get today's status (alias for getStatusByDate with no date)
    async getTodayStatus() {
        return await this.getStatusByDate();
    }

    // Save AI processed status
    async saveAIProcessedStatus(statusId, originalText, formattedText, processedBy, aiModel) {
        if (!this.initialized) throw new Error('Status Service not initialized');

        const query = `
            INSERT INTO status_ai_processed (status_id, original_text, formatted_text, processed_by, ai_model)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [statusId, originalText, formattedText, processedBy, aiModel];

        try {
            const result = await this.db.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error saving AI processed status:', error);
            throw error;
        }
    }

    // Get AI processed status for a date
    async getAIProcessedStatusByDate(date = null) {
        if (!this.initialized) throw new Error('Status Service not initialized');

        const targetDate = date || new Date().toISOString().split('T')[0];

        const query = `
            SELECT sa.*, sp.status_text, sp.created_at
            FROM status_ai_processed sa
            JOIN status_pekerjaan sp ON sa.status_id = sp.id
            WHERE DATE(sa.processed_at) = $1
            ORDER BY sa.processed_at ASC
        `;

        try {
            const result = await this.db.pool.query(query, [targetDate]);
            return result.rows;
        } catch (error) {
            console.error('Error getting AI processed status:', error);
            throw error;
        }
    }

    // Format status for display
    formatStatusForDisplay(status, index) {
        if (!status) return '';

        const tags = status.tags && status.tags.length > 0 ? status.tags.join(', ') : 'Tidak ada tags';
        const formattedTime = new Date(status.created_at).toLocaleString('id-ID');

        return `${index}. *${status.status_text.substring(0, 100)}${status.status_text.length > 100 ? '...' : ''}*
📝 Oleh: ${status.created_by}
🕐 ${formattedTime}
🏷️ Tags: ${tags}
---`;
    }

    // Format AI processed status for display
    formatAIStatusForDisplay(aiStatus, index) {
        if (!aiStatus) return '';

        const formattedTime = new Date(aiStatus.processed_at).toLocaleString('id-ID');

        return `${index}. *${aiStatus.formatted_text.substring(0, 150)}${aiStatus.formatted_text.length > 150 ? '...' : ''}*
📝 Asli: ${aiStatus.original_text.substring(0, 50)}${aiStatus.original_text.length > 50 ? '...' : ''}
🤖 Diproses oleh: ${aiStatus.processed_by}
🕐 ${formattedTime}
🤖 AI Model: ${aiStatus.ai_model}
---`;
    }

    // Get statistics
    async getStatusStats() {
        if (!this.initialized) throw new Error('Status Service not initialized');

        const queries = {
            totalStatus: 'SELECT COUNT(*) as count FROM status_pekerjaan',
            todayStatus: 'SELECT COUNT(*) as count FROM status_pekerjaan WHERE date_added = CURRENT_DATE',
            uniqueUsers: 'SELECT COUNT(DISTINCT created_by) as count FROM status_pekerjaan',
            topUsers: `
                SELECT created_by, COUNT(*) as status_count
                FROM status_pekerjaan
                WHERE date_added >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY created_by
                ORDER BY status_count DESC
                LIMIT 5
            `
        };

        try {
            const stats = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await this.db.pool.query(query);
                if (key === 'topUsers') {
                    stats[key] = result.rows;
                } else {
                    stats[key] = result.rows[0].count;
                }
            }
            return stats;
        } catch (error) {
            console.error('Error getting status stats:', error);
            throw error;
        }
    }

    // Close database connection
    async close() {
        if (this.db && this.db.pool) {
            await this.db.pool.end();
            console.log('✅ Status Service connection closed');
        }
    }
}

module.exports = StatusService;