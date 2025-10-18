const GroqService = require('./groqService');

class StatusAIService {
    constructor(groqApiKey) {
        this.groqService = new GroqService(groqApiKey);
        this.initialized = true;
    }

    async initialize() {
        // GroqService is initialized in constructor
        this.initialized = true;
        return true;
    }

    // Process status text for management
    async processStatusForManagement(statusList) {
        if (!this.initialized) {
            throw new Error('Status AI Service not initialized');
        }

        try {
            const prompt = `Anda adalah asisten AI yang ahli dalam formatting laporan pekerjaan.

Diberikan daftar status pekerjaan hari ini:

${statusList.map((status, index) => `${index + 1}. ${status.status_text} (oleh: ${status.created_by})`).join('\n')}

Tugas Anda:
1. Format ulang daftar status tersebut menjadi laporan yang lebih formal dan terstruktur
2. Kelompokkan status berdasarkan kategori yang sesuai (misal: proses legalitas, menunggu dokumen, sedang berjalan, selesai, dll)
3. Gunakan bahasa Indonesia yang formal dan profesional
4. Tambahkan heading yang jelas dan tanggal
5. Gunakan format yang cocok untuk disampaikan ke pimpinan/manajemen

Format output:
- Gunakan Markdown formatting
- Mulai dengan judul laporan dan tanggal
- Kelompokkan status dalam kategori yang relevan
- Setiap status sebutkan siapa yang melaporkan
- Tambahkan summary di akhir jika perlu

Tulis laporan lengkap dalam bahasa Indonesia:`;

            const response = await this.groqService.chatWithContext([], prompt);

            if (response.success) {
                return {
                    success: true,
                    formattedText: response.content,
                    originalCount: statusList.length,
                    processedAt: new Date().toISOString()
                };
            } else {
                throw new Error('AI processing failed');
            }
        } catch (error) {
            console.error('Error processing status for management:', error);
            throw error;
        }
    }

    // Get AI model info
    getAIModelInfo() {
        return {
            model: 'Groq (Llama/Mixtral)',
            purpose: 'Status Formatting for Management',
            capabilities: ['Text formatting', 'Categorization', 'Report generation']
        };
    }

    // Simple status enhancement (fallback if Groq fails)
    enhanceStatusText(statusText) {
        // Basic enhancement without AI
        const enhancements = {
            'proses': '🔄 Sedang Proses',
            'menunggu': '⏳ Menunggu',
            'selesai': '✅ Selesai',
            'legalitas': '⚖️ Legalitas',
            'dokumen': '📄 Dokumen',
            'akta': '📋 Akta',
            'izin': '📄 Izin',
            'persetujuan': '✅ Persetujuan'
        };

        let enhancedText = statusText.toLowerCase();
        for (const [key, emoji] of Object.entries(enhancements)) {
            enhancedText = enhancedText.replace(new RegExp(key, 'g'), `${emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}`);
        }

        return enhancedText.charAt(0).toUpperCase() + enhancedText.slice(1);
    }
}

module.exports = StatusAIService;