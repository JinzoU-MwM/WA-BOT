require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class MCPServer {
    constructor(databaseService, documentService, statusService) {
        this.server = new Server(
            {
                name: 'wa-bot-tools',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.databaseService = databaseService;
        this.documentService = documentService;
        this.statusService = statusService;

        this.setupToolHandlers();
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'search_users',
                    description: 'Search for users in the database by name, phone, or general query',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Search term - can be name, phone number, or general query',
                            },
                            searchType: {
                                type: 'string',
                                enum: ['all', 'name', 'phone', 'tags'],
                                description: 'Type of search to perform',
                                default: 'all',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_all_users',
                    description: 'Get all users from the database with pagination',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            limit: {
                                type: 'number',
                                description: 'Maximum number of users to return',
                                default: 20,
                            },
                            offset: {
                                type: 'number',
                                description: 'Number of users to skip',
                                default: 0,
                            },
                        },
                    },
                },
                {
                    name: 'get_message_statistics',
                    description: 'Get message statistics and analytics',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            period: {
                                type: 'string',
                                enum: ['today', 'week', 'month', 'all'],
                                description: 'Time period for statistics',
                                default: 'today',
                            },
                        },
                    },
                },
                {
                    name: 'browse_by_tags',
                    description: 'Browse users by tags or get popular tags',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            tagName: {
                                type: 'string',
                                description: 'Specific tag to search for (optional - if not provided, shows popular tags)',
                            },
                        },
                    },
                },
                {
                    name: 'check_document_shortage',
                    description: 'Check document shortages for a specific PT (company)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            ptName: {
                                type: 'string',
                                description: 'Name of the PT/company to check',
                            },
                        },
                        required: ['ptName'],
                    },
                },
                {
                    name: 'add_document_shortage',
                    description: 'Add document shortage for a PT/company',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            ptName: {
                                type: 'string',
                                description: 'Name of the PT/company',
                            },
                            jenisPekerjaan: {
                                type: 'string',
                                description: 'Type of work (e.g., PPIU, Umroh Plus, Haji Plus, Visa, Tiket)',
                            },
                            kekurangan: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                },
                                description: 'List of missing documents/items',
                            },
                            reportedBy: {
                                type: 'string',
                                description: 'Name of person reporting the shortage',
                            },
                        },
                        required: ['ptName', 'kekurangan', 'reportedBy'],
                    },
                },
                {
                    name: 'get_work_status',
                    description: 'Get work status reports for today or specific date',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            date: {
                                type: 'string',
                                description: 'Date to get status for (DD/MM/YYYY format, or "today", "kemarin", "besok")',
                                default: 'today',
                            },
                        },
                    },
                },
                {
                    name: 'add_work_status',
                    description: 'Add new work status',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            statusText: {
                                type: 'string',
                                description: 'Status text to add',
                            },
                            reportedBy: {
                                type: 'string',
                                description: 'Name of person reporting the status',
                            },
                        },
                        required: ['statusText', 'reportedBy'],
                    },
                },
                {
                    name: 'generate_ai_report',
                    description: 'Generate AI-formatted status report for management',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            date: {
                                type: 'string',
                                description: 'Date for the report (DD/MM/YYYY format, or "today")',
                                default: 'today',
                            },
                            requestedBy: {
                                type: 'string',
                                description: 'Name of person requesting the report',
                            },
                        },
                        required: ['requestedBy'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'search_users':
                        return await this.handleSearchUsers(args);
                    case 'get_all_users':
                        return await this.handleGetAllUsers(args);
                    case 'get_message_statistics':
                        return await this.handleGetMessageStatistics(args);
                    case 'browse_by_tags':
                        return await this.handleBrowseByTags(args);
                    case 'check_document_shortage':
                        return await this.handleCheckDocumentShortage(args);
                    case 'add_document_shortage':
                        return await this.handleAddDocumentShortage(args);
                    case 'get_work_status':
                        return await this.handleGetWorkStatus(args);
                    case 'add_work_status':
                        return await this.handleAddWorkStatus(args);
                    case 'generate_ai_report':
                        return await this.handleGenerateAIReport(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                console.error(`Error handling tool ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                };
            }
        });
    }

    async handleSearchUsers(args) {
        if (!this.databaseService || !this.databaseService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Database service is not available. Please try again later.',
                    },
                ],
            };
        }

        const results = await this.databaseService.searchUserData(args.query, args.searchType || 'all');

        if (results.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No users found for "${args.query}".`,
                    },
                ],
            };
        }

        let response = `Found ${results.length} user(s) for "${args.query}":\n\n`;

        results.forEach((user, index) => {
            const tags = user.tags && user.tags.length > 0 ? user.tags.join(', ') : 'No tags';
            const data = user.data_json || {};
            response += `${index + 1}. ${user.user_name || 'Unknown'}\n`;

            if (user.phone_number && !user.phone_number.includes('@')) {
                response += `   Phone: ${user.phone_number}\n`;
            }

            if (data.department) {
                response += `   Department: ${data.department}\n`;
            }

            response += `   Tags: ${tags}\n\n`;
        });

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleGetAllUsers(args) {
        if (!this.databaseService || !this.databaseService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Database service is not available. Please try again later.',
                    },
                ],
            };
        }

        const users = await this.databaseService.getAllUserData(args.limit || 20, args.offset || 0);

        if (users.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No users found in the database.',
                    },
                ],
            };
        }

        let response = `Showing ${users.length} user(s):\n\n`;

        users.forEach((user, index) => {
            const tags = user.tags && user.tags.length > 0 ? user.tags.join(', ') : 'No tags';
            const data = user.data_json || {};
            response += `${index + 1}. ${user.user_name || 'Unknown'}\n`;

            if (user.phone_number && !user.phone_number.includes('@')) {
                response += `   Phone: ${user.phone_number}\n`;
            }

            if (data.department) {
                response += `   Department: ${data.department}\n`;
            }

            response += `   Tags: ${tags}\n\n`;
        });

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleGetMessageStatistics(args) {
        if (!this.databaseService || !this.databaseService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Database service is not available. Please try again later.',
                    },
                ],
            };
        }

        const stats = await this.databaseService.getMessageStats();

        let response = `Message Statistics:\n\n`;
        response += `Total Messages: ${stats.totalMessages}\n`;
        response += `Messages Today: ${stats.todayMessages}\n`;
        response += `Unique Users: ${stats.uniqueUsers}\n\n`;

        if (stats.topChatters && stats.topChatters.length > 0) {
            response += `Top Chatters Today:\n`;
            stats.topChatters.forEach((user, index) => {
                response += `${index + 1}. ${user.chat_id}: ${user.message_count} messages\n`;
            });
        }

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleBrowseByTags(args) {
        if (!this.databaseService || !this.databaseService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Database service is not available. Please try again later.',
                    },
                ],
            };
        }

        if (args.tagName) {
            // Search for specific tag
            const results = await this.databaseService.searchUserData(args.tagName, 'tags');

            if (results.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No users found with tag "${args.tagName}".`,
                        },
                    ],
                };
            }

            let response = `Found ${results.length} user(s) with tag "${args.tagName}":\n\n`;

            results.forEach((user, index) => {
                const tags = user.tags && user.tags.length > 0 ? user.tags.join(', ') : 'No tags';
                response += `${index + 1}. ${user.user_name || 'Unknown'}\n`;
                response += `   Tags: ${tags}\n\n`;
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: response,
                    },
                ],
            };
        } else {
            // Show popular tags
            const users = await this.databaseService.getAllUserData(100, 0);
            const tagCounts = {};

            users.forEach(user => {
                if (user.tags && Array.isArray(user.tags)) {
                    user.tags.forEach(tag => {
                        if (tag && tag.trim()) {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        }
                    });
                }
            });

            const sortedTags = Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20);

            if (sortedTags.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No tags found in the database.',
                        },
                    ],
                };
            }

            let response = `Popular Tags:\n\n`;

            sortedTags.forEach(([tag, count], index) => {
                response += `${index + 1}. ${tag} (${count} users)\n`;
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: response,
                    },
                ],
            };
        }
    }

    async handleCheckDocumentShortage(args) {
        if (!this.documentService || !this.documentService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Document service is not available. Please try again later.',
                    },
                ],
            };
        }

        const results = await this.documentService.searchDocuments(args.ptName.trim());

        if (results.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No documents found for PT "${args.ptName}".`,
                    },
                ],
            };
        }

        const kekuranganDocs = results.filter(doc => doc.document_type === 'Kekurangan Dokumen');

        let response = `Document shortage for "${args.ptName}":\n\n`;

        if (kekuranganDocs.length > 0) {
            kekuranganDocs.forEach((doc, index) => {
                response += `${index + 1}. ${doc.description}\n`;
                response += `   Reported by: ${doc.created_by}\n`;
                response += `   Date: ${new Date(doc.created_at).toLocaleDateString()}\n\n`;
            });
        } else {
            response += 'No document shortages found.\n\n';
            response += 'Available documents:\n';
            results.forEach((doc, index) => {
                response += `${index + 1}. ${doc.document_type}: ${doc.document_name}\n`;
            });
        }

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleAddDocumentShortage(args) {
        if (!this.documentService || !this.documentService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Document service is not available. Please try again later.',
                    },
                ],
            };
        }

        const documentData = {
            documentType: 'Kekurangan Dokumen',
            documentName: `Kekurangan ${args.jenisPekerjaan || 'Tidak Spesifik'} - ${new Date().toLocaleDateString()}`,
            description: `Jenis Pekerjaan: ${args.jenisPekerjaan || 'Tidak Spesifik'}\nKekurangan: ${args.kekurangan.join('; ')}`,
            createdBy: args.reportedBy,
            tags: ['kekurangan', 'update', (args.jenisPekerjaan || '').toLowerCase(), args.reportedBy.toLowerCase()]
        };

        await this.documentService.addDocument(args.ptName, documentData);

        const response = `Document shortage added successfully for "${args.ptName}":\n\n` +
            `Type: Kekurangan Dokumen\n` +
            `Work Type: ${args.jenisPekerjaan || 'Tidak Spesifik'}\n` +
            `Missing Items: ${args.kekurangan.join(', ')}\n` +
            `Reported by: ${args.reportedBy}\n` +
            `Date: ${new Date().toLocaleDateString()}`;

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleGetWorkStatus(args) {
        if (!this.statusService || !this.statusService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Status service is not available. Please try again later.',
                    },
                ],
            };
        }

        let targetDate;
        try {
            if (args.date.toLowerCase() === 'today' || args.date === 'today') {
                targetDate = new Date().toISOString().split('T')[0];
            } else if (args.date.toLowerCase() === 'kemarin') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                targetDate = yesterday.toISOString().split('T')[0];
            } else if (args.date.toLowerCase() === 'besok') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                targetDate = tomorrow.toISOString().split('T')[0];
            } else {
                // Try DD/MM/YYYY format
                const parts = args.date.split('/');
                if (parts.length === 3) {
                    targetDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else {
                    throw new Error('Invalid date format');
                }
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Invalid date format. Use DD/MM/YYYY or "today", "kemarin", "besok".',
                    },
                ],
            };
        }

        const statusList = await this.statusService.getStatusByDate(targetDate);

        if (statusList.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No work status found for ${targetDate}.`,
                    },
                ],
            };
        }

        let response = `Work Status for ${targetDate}:\n\n`;

        statusList.forEach((status, index) => {
            response += `${index + 1}. ${status.status_text}\n`;
            response += `   By: ${status.created_by}\n`;
            response += `   Time: ${new Date(status.created_at).toLocaleTimeString()}\n\n`;
        });

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleAddWorkStatus(args) {
        if (!this.statusService || !this.statusService.initialized) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Status service is not available. Please try again later.',
                    },
                ],
            };
        }

        const status = await this.statusService.addStatus(
            args.statusText,
            args.reportedBy,
            ['user-added', 'manual-update']
        );

        const response = `Work status added successfully:\n\n` +
            `Status: ${status.status_text}\n` +
            `Reported by: ${args.reportedBy}\n` +
            `Date: ${new Date().toLocaleDateString()}\n` +
            `Time: ${new Date().toLocaleTimeString()}`;

        return {
            content: [
                {
                    type: 'text',
                    text: response,
                },
            ],
        };
    }

    async handleGenerateAIReport(args) {
        // This would integrate with the existing status AI service
        // For now, return a placeholder response
        return {
            content: [
                {
                    type: 'text',
                    text: `AI report generation requested by ${args.requestedBy} for ${args.date}. This feature would integrate with your existing StatusAIService to generate formatted reports for management.`,
                },
            ],
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('WhatsApp Bot MCP Server running on stdio');
    }
}

module.exports = MCPServer;