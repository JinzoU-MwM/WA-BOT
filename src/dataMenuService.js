class DataMenuService {
    constructor(databaseService) {
        this.db = databaseService;
        this.userMenuStates = new Map(); // Track user menu states
    }

    async handleDataCommand(chatId, senderName, message) {
        // Use the same user ID calculation as the bot
        const userId = chatId.includes('@g.us') ? `${chatId}_${senderName}` : chatId;

        // Check if user is in an active menu state
        if (this.userMenuStates.has(userId)) {
            return await this.handleMenuSelection(userId, message, chatId, senderName);
        }
        return await this.showMainMenu(chatId, senderName, userId);
    }

    async showMainMenu(chatId, senderName, userId) {
        const menuMessage = `📊 *Menu Data - Pilih opsi:*

1. 🔍 Cari data pengguna
2. 📋 Lihat semua pengguna
3. 📈 Lihat statistik pesan
4. 🏷️ Jelajahi berdasarkan tags
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
            return '⏰ Sesi menu berakhir. Silakan kirim perintah .data lagi untuk memulai.';
        }

        const selection = message.trim();

        switch (userState.state) {
            case 'main_menu':
                return await this.handleMainMenuSelection(userId, selection, chatId, senderName);

            case 'search_type':
                return await this.handleSearchTypeSelection(userId, selection, chatId, senderName);

            case 'search_input':
                return await this.handleSearchInput(userId, selection, chatId, senderName);

            case 'view_users':
                return await this.handleUserNavigation(userId, selection, chatId, senderName);

            case 'browse_tags':
                return await this.handleTagBrowsing(userId, selection, chatId, senderName);

            default:
                this.userMenuStates.delete(userId);
                return await this.showMainMenu(chatId, senderName, userId);
        }
    }

    async handleMainMenuSelection(userId, selection, chatId, senderName) {
        const userState = this.userMenuStates.get(userId);
        if (!userState) {
            this.userMenuStates.delete(userId);
            return await this.showMainMenu(chatId, senderName, userId);
        }

        switch (selection) {
            case '1':
                userState.state = 'search_type';
                userState.timestamp = Date.now();
                return `🔍 *Cari data pengguna - Pilih tipe pencarian:*

1. 👤 Cari berdasarkan nama
2. 📞 Cari berdasarkan nomor telepon
3. 🏷️ Cari berdasarkan tags
4. 🔍 Cari di semua field
5. ⬅️ Kembali ke menu utama

Balas dengan angka (1-5):`;

            case '2':
                return await this.showUsersList(userId, chatId, senderName);

            case '3':
                return await this.showMessageStatistics(chatId, senderName, userId);

            case '4':
                return await this.showTagsList(userId, chatId, senderName);

            case '5':
            case 'exit':
            case 'quit':
                this.userMenuStates.delete(userId);
                return '👋 Menu data ditutup. Kirim .data lagi kapan saja untuk mengakses database.';

            default:
                return '❌ Pilihan tidak valid. Silakan balas dengan angka 1-5.';
        }
    }

    async handleSearchTypeSelection(userId, selection, chatId, senderName) {
        const userState = this.userMenuStates.get(userId);

        switch (selection) {
            case '1':
                userState.state = 'search_input';
                userState.searchType = 'name';
                return '👤 *Cari berdasarkan nama*\n\nSilakan masukkan nama yang ingin Anda cari:';

            case '2':
                userState.state = 'search_input';
                userState.searchType = 'phone';
                return '📞 *Cari berdasarkan nomor telepon*\n\nSilakan masukkan nomor telepon yang ingin Anda cari:';

            case '3':
                userState.state = 'search_input';
                userState.searchType = 'tags';
                return '🏷️ *Cari berdasarkan tags*\n\nSilakan masukkan tag yang ingin Anda cari:';

            case '4':
                userState.state = 'search_input';
                userState.searchType = 'all';
                return '🔍 *Cari di semua field*\n\nSilakan masukkan kata pencarian Anda:';

            case '5':
                userState.state = 'main_menu';
                return await this.showMainMenu(chatId, senderName, userId);

            default:
                return '❌ Invalid selection. Please reply with a number between 1-5.';
        }
    }

    async handleSearchInput(userId, searchTerm, chatId, senderName) {
        const userState = this.userMenuStates.get(userId);

        if (!searchTerm || searchTerm.trim().length === 0) {
            return '❌ Please enter a valid search term:';
        }

        try {
            const results = await this.db.searchUserData(searchTerm.trim(), userState.searchType);

            if (results.length === 0) {
                userState.state = 'main_menu';
                return `❌ No results found for "${searchTerm}".\n\n${await this.showMainMenu(chatId, senderName, userId)}`;
            }

            // Format results
            let response = `🔍 *Search Results (${results.length} found):*\n\n`;

            results.slice(0, 10).forEach((user, index) => {
                response += this.db.formatUserDataForDisplay(user, index + 1);
            });

            if (results.length > 10) {
                response += `\n... and ${results.length - 10} more results.`;
            }

            response += '\n\n⬅️ Reply "back" to return to main menu';

            userState.state = 'main_menu';
            return response;

        } catch (error) {
            console.error('Search error:', error);
            return '❌ An error occurred while searching. Please try again.';
        }
    }

    async showUsersList(userId, chatId, senderName, page = 1) {
        const limit = 5;
        const offset = (page - 1) * limit;

        try {
            const users = await this.db.getAllUserData(limit, offset);

            if (users.length === 0 && page === 1) {
                return '📋 Tidak ada pengguna yang ditemukan dalam database.';
            }

            let response = `📋 *All Users (Page ${page}):*\n\n`;

            users.forEach((user, index) => {
                response += this.db.formatUserDataForDisplay(user, (page - 1) * limit + index + 1);
            });

            // Add navigation options
            response += '\n📖 *Navigation:*\n';
            response += '• Reply "next" for next page\n';
            if (page > 1) {
                response += '• Reply "prev" for previous page\n';
            }
            response += '• Reply "back" to return to main menu';

            const userState = this.userMenuStates.get(userId);
            userState.state = 'view_users';
            userState.currentPage = page;
            userState.timestamp = Date.now();

            return response;

        } catch (error) {
            console.error('Error fetching users:', error);
            return '❌ An error occurred while fetching users. Please try again.';
        }
    }

    async handleUserNavigation(userId, selection, chatId, senderName) {
        const userState = this.userMenuStates.get(userId);
        const currentPage = userState.currentPage || 1;

        switch (selection.toLowerCase()) {
            case 'next':
                return await this.showUsersList(userId, chatId, senderName, currentPage + 1);

            case 'prev':
            case 'previous':
                if (currentPage > 1) {
                    return await this.showUsersList(userId, chatId, senderName, currentPage - 1);
                } else {
                    return '❌ You are already on the first page.';
                }

            case 'back':
                const navUserState = this.userMenuStates.get(userId);
                if (navUserState) {
                    navUserState.state = 'main_menu';
                }
                return await this.showMainMenu(chatId, senderName, userId);

            default:
                return '❌ Invalid navigation. Please reply with "next", "prev", or "back".';
        }
    }

    async showMessageStatistics(chatId, senderName, userId) {
        try {
            const stats = await this.db.getMessageStats();

            const response = `📈 *Message Statistics:*

📊 Total Messages: ${stats.totalMessages}
📅 Messages Today: ${stats.todayMessages}
👥 Unique Users: ${stats.uniqueUsers}

🔥 *Top Chatters Today:*
${stats.topChatters.map((user, index) =>
    `${index + 1}. ${user.chat_id}: ${user.message_count} messages`
).join('\n')}

⬅️ Reply "back" to return to main menu`;

            const userState = this.userMenuStates.get(userId);
            userState.state = 'main_menu';
            userState.timestamp = Date.now();

            return response;

        } catch (error) {
            console.error('Error fetching statistics:', error);
            return '❌ An error occurred while fetching statistics. Please try again.';
        }
    }

    async showTagsList(userId, chatId, senderName) {
        try {
            // Get all users and extract tags manually for SQLite compatibility
            const users = await this.db.getAllUserData(1000, 0); // Get more users to extract tags

            const tagCounts = {};

            // Count tags from all users
            users.forEach(user => {
                if (user.tags && Array.isArray(user.tags)) {
                    user.tags.forEach(tag => {
                        if (tag && tag.trim()) {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        }
                    });
                }
            });

            // Convert to array and sort by count
            const sortedTags = Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20); // Top 20 tags

            if (sortedTags.length === 0) {
                return '🏷️ No tags found in the database.';
            }

            let response = `🏷️ *Popular Tags:*\n\n`;

            sortedTags.forEach(([tag, count], index) => {
                response += `${index + 1}. ${tag} (${count} users)\n`;
            });

            response += '\n💡 Reply with a tag name to see users with that tag';
            response += '\n⬅️ Reply "back" to return to main menu';

            const userState = this.userMenuStates.get(userId);
            userState.state = 'browse_tags';
            userState.timestamp = Date.now();

            return response;

        } catch (error) {
            console.error('Error fetching tags:', error);
            return '❌ An error occurred while fetching tags. Please try again.';
        }
    }

    async handleTagBrowsing(userId, selection, chatId, senderName) {
        if (selection.toLowerCase() === 'back') {
            const userState = this.userMenuStates.get(userId);
            userState.state = 'main_menu';
            return await this.showMainMenu(chatId, senderName, userId);
        }

        // Treat selection as a tag search
        try {
            const results = await this.db.searchUserData(selection.trim(), 'tags');

            if (results.length === 0) {
                return `❌ Tidak ada pengguna yang ditemukan dengan tag "${selection}".\n\nCoba tag lain atau balas "back" untuk kembali ke menu utama.`;
            }

            let response = `🏷️ *Users with tag "${selection}"* (${results.length} found):\n\n`;

            results.forEach((user, index) => {
                response += this.db.formatUserDataForDisplay(user, index + 1);
            });

            response += '\n⬅️ Reply "back" to return to tags list';

            return response;

        } catch (error) {
            console.error('Error searching by tag:', error);
            return '❌ An error occurred while searching by tag. Please try again.';
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

module.exports = DataMenuService;