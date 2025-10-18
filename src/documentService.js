const { Pool } = require('pg');

class DocumentService {
    constructor(databaseService) {
        this.db = databaseService;
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.createDocumentTables();
            this.initialized = true;
            console.log('✅ Document Service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Document Service initialization failed:', error);
            return false;
        }
    }

    async createDocumentTables() {
        const createTablesQuery = `
            -- Document data table
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                pt_name VARCHAR(255) NOT NULL,
                document_type VARCHAR(100) NOT NULL,
                document_name VARCHAR(255) NOT NULL,
                file_path TEXT,
                description TEXT,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                tags TEXT[]
            );

            -- Document access logs
            CREATE TABLE IF NOT EXISTS document_access_logs (
                id SERIAL PRIMARY KEY,
                pt_name VARCHAR(255) NOT NULL,
                accessed_by VARCHAR(255) NOT NULL,
                access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                search_term VARCHAR(255)
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_documents_pt_name ON documents(pt_name);
            CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
            CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
            CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
            CREATE INDEX IF NOT EXISTS idx_document_logs_pt_name ON document_access_logs(pt_name);
            CREATE INDEX IF NOT EXISTS idx_document_logs_time ON document_access_logs(access_time);
        `;

        try {
            await this.db.pool.query(createTablesQuery);
            console.log('✅ Document tables created successfully');
        } catch (error) {
            console.error('❌ Error creating document tables:', error);
            throw error;
        }
    }

    // Add document to database
    async addDocument(ptName, documentData) {
        if (!this.initialized) throw new Error('Document Service not initialized');

        const query = `
            INSERT INTO documents (pt_name, document_type, document_name, file_path, description, created_by, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            ptName,
            documentData.documentType,
            documentData.documentName,
            documentData.filePath || null,
            documentData.description || null,
            documentData.createdBy,
            documentData.tags || []
        ];

        try {
            const result = await this.db.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    }

    // Search documents by PT name
    async searchDocuments(ptName) {
        if (!this.initialized) throw new Error('Document Service not initialized');

        // Log the search
        await this.logDocumentAccess(ptName, 'search', ptName);

        const query = `
            SELECT * FROM documents
            WHERE pt_name ILIKE $1
            ORDER BY document_name ASC
        `;

        try {
            const result = await this.db.pool.query(query, [`%${ptName}%`]);
            return result.rows;
        } catch (error) {
            console.error('Error searching documents:', error);
            throw error;
        }
    }

    // Get all PT names available
    async getAllPTNames() {
        if (!this.initialized) throw new Error('Document Service not initialized');

        const query = `
            SELECT DISTINCT pt_name, COUNT(*) as document_count
            FROM documents
            WHERE status = 'active'
            GROUP BY pt_name
            ORDER BY pt_name ASC
        `;

        try {
            const result = await this.db.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting PT names:', error);
            throw error;
        }
    }

    // Get documents statistics
    async getDocumentStats() {
        if (!this.initialized) throw new Error('Document Service not initialized');

        const queries = {
            totalDocuments: 'SELECT COUNT(*) as count FROM documents WHERE status = \'active\'',
            totalPT: 'SELECT COUNT(DISTINCT pt_name) as count FROM documents WHERE status = \'active\'',
            recentSearches: `
                SELECT pt_name, COUNT(*) as search_count
                FROM document_access_logs
                WHERE access_time >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY pt_name
                ORDER BY search_count DESC
                LIMIT 5
            `,
            documentTypes: `
                SELECT document_type, COUNT(*) as count
                FROM documents
                WHERE status = 'active'
                GROUP BY document_type
                ORDER BY count DESC
            `
        };

        try {
            const stats = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await this.db.pool.query(query);
                if (key === 'recentSearches' || key === 'documentTypes') {
                    stats[key] = result.rows;
                } else {
                    stats[key] = result.rows[0].count;
                }
            }
            return stats;
        } catch (error) {
            console.error('Error getting document stats:', error);
            throw error;
        }
    }

    // Log document access
    async logDocumentAccess(ptName, action, accessedBy, searchTerm = null) {
        if (!this.initialized) return;

        const query = `
            INSERT INTO document_access_logs (pt_name, accessed_by, search_term)
            VALUES ($1, $2, $3)
        `;

        const values = [ptName, accessedBy, searchTerm];

        try {
            await this.db.pool.query(query, values);
        } catch (error) {
            console.error('Error logging document access:', error);
        }
    }

    // Format document for display
    formatDocumentForDisplay(doc, index) {
        if (!doc) return '';

        const tags = doc.tags && doc.tags.length > 0 ? doc.tags.join(', ') : 'Tidak ada tags';
        const description = doc.description ? (doc.description.length > 100 ? doc.description.substring(0, 100) + '...' : doc.description) : 'Tidak ada deskripsi';

        return `*${index}. ${doc.document_name}*
📋 Tipe: ${doc.document_type}
🏢 PT: ${doc.pt_name}
📄 Deskripsi: ${description}
🏷️ Tags: ${tags}
📅 Ditambahkan: ${new Date(doc.created_at).toLocaleDateString()}
---`;
    }

    // Close database connection
    async close() {
        if (this.db && this.db.pool) {
            await this.db.pool.end();
            console.log('✅ Document Service connection closed');
        }
    }
}

module.exports = DocumentService;