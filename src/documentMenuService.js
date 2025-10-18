class DocumentMenuService {
    constructor(documentService) {
        this.documentService = documentService;
        this.userMenuStates = new Map(); // Track user menu states
    }

    async handleDocumentCommand(chatId, senderName, message) {
        const userId = this.getUserId(chatId, senderName);

        // Check if user is in an active menu state
        if (this.userMenuStates.has(userId)) {
            return await this.handleMenuSelection(userId, message, chatId, senderName);
        }

        // Show main document menu
        return await this.showMainMenu(chatId, senderName, userId);
    }

    getUserId(chatId, senderName) {
        // Use the same user ID calculation as the bot
        return chatId.includes('@g.us') ? `${chatId}_${senderName}` : chatId;
    }

    async showMainMenu(chatId, senderName, userId) {
        const menuMessage = `📋 *Menu Manajemen Dokumen - Pilih opsi:*

1. 🔍 Cari dokumen berdasarkan nama PT
2. 📋 Lihat semua perusahaan PT
3. 📊 Lihat statistik dokumen
4. ➕ Tambah dokumen baru
5. ❌ Keluar menu

Balas dengan angka (1-5) untuk memilih opsi.`;

        // Set user in menu state
        this.userMenuStates.set(userId, {
            state: 'main_menu',
            timestamp: Date.now()
        });

        return menuMessage;
    }

    async handleMenuSelection(userId, message, chatId, senderName) {
        const userState = this.userMenuStates.get(userId);
        if (!userState) {
            this.userMenuStates.delete(userId);
            return await this.showMainMenu(chatId, senderName, userId);
        }

        // Check for timeout (5 minutes)
        if (Date.now() - userState.timestamp > 5 * 60 * 1000) {
            this.userMenuStates.delete(userId);
            return '⏰ Sesi menu berakhir. Silakan kirim perintah lagi untuk memulai.';
        }

        const selection = message.trim();

        switch (userState.state) {
            case 'main_menu':
                return await this.handleMainMenuSelection(userId, selection, chatId, senderName);

            case 'search_pt':
                return await this.handlePTSearchInput(userId, selection, chatId, senderName);

            case 'add_document':
                return await this.handleAddDocument(userId, selection, chatId, senderName);

            default:
                this.userMenuStates.delete(userId);
                return await this.showMainMenu(chatId, senderName, userId);
        }
    }

    async handleMainMenuSelection(userId, selection, chatId, senderName) {
        switch (selection) {
            case '1':
                userState.state = 'search_pt';
                userState.timestamp = Date.now();
                return `🔍 *Search Documents by PT Name*\n\nPlease enter the PT name you want to search for:\n\n💡 Example: "PT Maju Bersatu" or "Travel Umroh"\n\n⬅️ Reply "back" to return to main menu`;

            case '2':
                return await this.showAllPTs(userId, chatId, senderName);

            case '3':
                return await this.showDocumentStatistics(userId, chatId, senderName);

            case '4':
                return await this.showAddDocumentInstructions(userId, chatId, senderName);

            case '5':
            case 'exit':
            case 'quit':
                this.userMenuStates.delete(userId);
                return '👋 Menu dokumen ditutup. Kirim perintah lagi kapan saja untuk mengakses manajemen dokumen.';

            default:
                return '❌ Pilihan tidak valid. Silakan balas dengan angka 1-5.';
        }
    }

    async handlePTSearchInput(userId, selection, chatId, senderName) {
        if (selection.toLowerCase() === 'back') {
            const userState = this.userMenuStates.get(userId);
            if (userState) {
                userState.state = 'main_menu';
                return await this.showMainMenu(chatId, senderName, userId);
            }
        }

        if (!selection || selection.trim().length === 0) {
            return '❌ Silakan masukkan nama PT yang valid:';
        }

        try {
            const results = await this.documentService.searchDocuments(selection.trim());

            if (results.length === 0) {
                userState.state = 'main_menu';
                return `❌ Tidak ada dokumen yang ditemukan untuk PT "${selection}".\n\n💡 Pastikan nama PT benar atau periksa apakah dokumen sudah ditambahkan.\n\n${await this.showMainMenu(chatId, senderName, userId)}`;
            }

            // Format results
            let response = `🔍 *Dokumen Ditemukan untuk "${selection}" (${results.length} ditemukan):*\n\n`;

            results.slice(0, 20).forEach((doc, index) => {
                response += this.documentService.formatDocumentForDisplay(doc, index + 1);
            });

            if (results.length > 20) {
                response += `\n... dan ${results.length - 20} dokumen lagi.`;
            }

            response += '\n⬅️ Balas "back" untuk kembali ke menu utama';

            userState.state = 'main_menu';
            return response;

        } catch (error) {
            console.error('Error searching documents:', error);
            return '❌ Terjadi kesalahan saat mencari. Silakan coba lagi.';
        }
    }

    async showAllPTs(userId, chatId, senderName) {
        try {
            const ptNames = await this.documentService.getAllPTNames();

            if (ptNames.length === 0) {
                return '📋 Tidak ada perusahaan PT yang ditemukan dalam database.\n\n💡 Tambahkan dokumen menggunakan opsi 4 di menu.\n\n⬅️ Balas "back" untuk kembali ke menu utama';
            }

            let response = `📋 *Semua Perusahaan PT (${ptNames.length} ditemukan):*\n\n`;

            ptNames.forEach((pt, index) => {
                response += `${index + 1}. ${pt.pt_name} (${pt.document_count} dokumen)\n`;
            });

            response += '\n💡 Balas dengan nama PT untuk mencari atau gunakan opsi 1 untuk mencari.\n⬅️ Balas "back" untuk kembali ke menu utama';

            const userState = this.userMenuStates.get(userId);
            userState.state = 'main_menu';
            userState.timestamp = Date.now();

            return response;

        } catch (error) {
            console.error('Error getting PT names:', error);
            return '❌ Terjadi kesalahan saat mengambil data perusahaan PT. Silakan coba lagi.';
        }
    }

    async showDocumentStatistics(userId, chatId, senderName) {
        try {
            const stats = await this.documentService.getDocumentStats();

            const response = `📊 *Statistik Dokumen:*

📋 Total Dokumen: ${stats.totalDocuments}
🏢 Total Perusahaan PT: ${stats.totalPT}
📅 Dokumen Aktif: ${stats.totalDocuments}

📈 *Tipe Dokumen:*
${stats.documentTypes.map((type, index) =>
    `${index + 1}. ${type.document_type}: ${type.count} dokumen`
).join('\n') || 'Tidak ada dokumen yang ditemukan'}

🔥 *Pencarian Terkini (7 hari):*
${stats.recentSearches.map((search, index) =>
    `${index + 1}. ${search.pt_name}: ${search.search_count} pencarian`
).join('\n') || 'Tidak ada pencarian terkini'}

⬅️ Balas "back" untuk kembali ke menu utama`;

            const userState = this.userMenuStates.get(userId);
            userState.state = 'main_menu';
            userState.timestamp = Date.now();

            return response;

        } catch (error) {
            console.error('Error getting document statistics:', error);
            return '❌ Terjadi kesalahan saat mengambil statistik. Silakan coba lagi.';
        }
    }

    async showAddDocumentInstructions(userId, chatId, senderName) {
        const instructions = `➕ *Tambah Dokumen Baru*

Untuk menambah dokumen, gunakan format berikut:

".kekuranganpt Nama PT:Tipe Dokumen:Nama Dokumen:Deskripsi:Tags (pisahkan dengan koma)"

**Contoh:**
".kekuranganpt PT Maju Bersatu:Travel Agreement:Kontrak Agen Travel:Kontrak untuk agen travel:travel,kontrak,agen"

**Kolom:**
• **Nama PT**: Nama perusahaan PT
• **Tipe Dokumen**: Jenis dokumen (misal: Travel Agreement, Paket Umroh, dll.)
• **Nama Dokumen**: Nama spesifik dokumen
• **Deskripsi**: Deskripsi singkat dokumen
• **Tags**: Tag untuk kategorisasi (pisahkan dengan koma)

**Tipe Dokumen Tersedia:**
• Travel Agreement (Perjanjian Travel)
• Umroh Package (Paket Umroh)
• Contract Agreement (Perjanjian Kontrak)
• Insurance Policy (Polis Asuransi)
• Visa Application (Aplikasi Visa)
• Ticket Booking (Pemesanan Tiket)
• Hotel Voucher (Voucher Hotel)
• Other Travel Documents (Dokumen Travel Lainnya)

⬅️ Balas "back" untuk kembali ke menu utama`;

        const userState = this.userMenuStates.get(userId);
        userState.state = 'main_menu';
        userState.timestamp = Date.now();

        return instructions;
    }

    async handleAddDocument(userId, message, chatId, senderName) {
        // Parse the .kekuranganpt command
        if (!message.toLowerCase().startsWith('.kekuranganpt')) {
            return '❌ Format tidak valid. Silakan gunakan format yang benar:\n\n".kekuranganpt Nama PT:Tipe Dokumen:Nama Dokumen:Deskripsi:Tags"';
        }

        // Remove the command prefix and parse
        const content = message.substring(14).trim(); // Remove '.kekuranganpt '
        const parts = content.split(':').map(part => part.trim());

        if (parts.length < 3) {
            return '❌ Informasi tidak lengkap. Silakan sertakan minimal:\n\nNama PT:Tipe Dokumen:Nama Dokumen\n\nContoh:\n.kekuranganpt PT Maju Bersatu:Travel Agreement:Kontrak Agen Travel:travel,agent';
        }

        const [ptName, documentType, documentName, ...rest] = parts;
        const description = rest[0] || '';
        const tags = rest[1] ? rest[1].split(',').map(tag => tag.trim()) : [];

        const documentData = {
            documentType,
            documentName,
            description,
            createdBy: senderName,
            tags
        };

        try {
            await this.documentService.addDocument(ptName, documentData);

            const response = `✅ *Dokumen Berhasil Ditambahkan!*

📋 Nama PT: ${ptName}
📄 Tipe Dokumen: ${documentType}
📜 Nama Dokumen: ${documentName}
📝 Deskripsi: ${description || 'Tidak ada deskripsi'}
🏷️ Tags: ${tags.join(', ') || 'Tidak ada tags'}
👤 Ditambahkan oleh: ${senderName}
📅 Ditambahkan: ${new Date().toLocaleDateString()}

Dokumen sekarang dapat dicari dalam database! 📋

⬅️ Balas "back" untuk kembali ke menu utama`;

            const userState = this.userMenuStates.get(userId);
            userState.state = 'main_menu';
            userState.timestamp = Date.now();

            return response;

        } catch (error) {
            console.error('Error adding document:', error);
            return '❌ Terjadi kesalahan saat menambah dokumen. Silakan coba lagi.';
        }
    }

    // Clean up old menu states (call periodically)
    cleanup() {
        const now = Date.now();
        const timeout = 10 * 60 * 1000; // 10 minutes

        for (const [userId, state] of this.userMenuStates.entries()) {
            if (now - state.timestamp > timeout) {
                this.userMenuStates.delete(userId);
            }
        }
    }

    // Clear user's menu state
    clearUserState(userId) {
        this.userMenuStates.delete(userId);
    }
}

module.exports = DocumentMenuService;