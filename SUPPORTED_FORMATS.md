# Supported Document Shortage Formats

This WhatsApp AI Bot now supports comprehensive natural language parsing for document shortage management. Users can add and check document shortages using various formats.

## 📝 **ADD DOCUMENT SHORTAGE FORMATS**

### Basic Formats (Indonesian)
- `!p tambahkan kekurangan PT [nama] 1. KTP 2. NPWP`
- `tambah kekurangan PT [nama]: KTP, NPWP, Passport`
- `update kekurangan PT [nama]: [jenis]: [item1], [item2], [item3]`

### Alternative Prefixes
- `berikut kekurangan PT [nama] - KTP - NPWP - Passport`
- `ikut kekurangan PT [nama]: 1. Visa 2. Tiket 3. Asuransi`
- `ini kekurangan PT [nama]: Haji Plus: Paspor, Visa, Bukti Booking`
- `dibawah ini kekurangan PT [nama]: KTP NPWP Passport`

### English Formats
- `missing documents PT [nama]: 1. KTP 2. NPWP 3. Passport 4. SK`
- `missing PT [nama]: KTP, NPWP, Passport`
- `hilang dokumen PT [nama]: Paspor, Visa, Tiket Pesawat`

### Separator Options
- **Numbered list**: `1. KTP 2. NPWP 3. Passport`
- **Comma separated**: `KTP, NPWP, Passport`
- **Dash separated**: `KTP - NPWP - Passport`
- **Colon separated**: `KTP: NPWP: Passport`
- **Space separated**: `KTP NPWP Passport`

### With Work Type (Jenis Pekerjaan)
- `PT [nama]: PPIU: KTP, Paspor, SK PPIU`
- `PT [nama]: Umroh Plus: Paspor, Visa`
- `PT [nama]: Haji Plus: Paspor, Visa, Bukti Booking`
- `PT [nama]: Visa: 1. KTP 2. SK 3. Bukti Rekening`

### Command Prefixes
- `!p` (your custom command)
- No prefix (natural language)
- Traditional commands also supported

## 🔍 **CHECK DOCUMENT SHORTAGE FORMATS**

### Direct Questions
- `cek kekurangan PT [nama]`
- `apa kekurangan PT [nama]`
- `what kekurangan PT [nama]`
- `apa saja kekurangan PT [nama]`

### Display Formats
- `tampilkan kekurangan PT [nama]`
- `lihat kekurangan PT [nama]`
- `show kekurangan PT [nama]`

### Simple Format
- `PT [nama] kekurangan`

## 🎯 **EXAMPLES IN ACTION**

### Adding Documents
```
User: !p tambahkan kekurangan PT merdeka 1. KTP 2.NPWP
Bot: ✅ Document shortage added successfully for "merdeka":
     Type: Kekurangan Dokumen
     Missing Items: KTP, NPWP
     Reported by: User
     Date: 19/10/2025
```

```
User: berikut kekurangan PT Maju Bersama: PPIU: KTP, Paspor, SK PPIU
Bot: ✅ Document shortage added successfully for "Maju Bersama":
     Type: Kekurangan Dokumen
     Work Type: PPIU
     Missing Items: KTP, Paspor, SK PPIU
```

### Checking Documents
```
User: apa kekurangan PT merdeka
Bot: 📋 Document shortage for "merdeka":
     1. Jenis Pekerjaan: PPIU
        Kekurangan: KTP; Paspor; SK PPIU
        Reported by: Admin
        Date: 19/10/2025
```

## 🔧 **SUPPORTED TRIGGER WORDS**

### For Adding Documents
- `tambah`, `tambahkan`, `update`, `insert`, `add`
- `berikut`, `ikut`, `ini`, `dibawah ini`
- `missing`, `hilang`

### For Checking Documents
- `cek`, `check`, `apa`, `what`
- `tampilkan`, `lihat`, `show`

### General
- `kekurangan`, `document`, `dokumen`
- `pt`, `perusahaan`, `company`

## 📋 **WORK TYPES AUTOMATICALLY RECOGNIZED**

The system automatically recognizes common work types:
- `PPIU`, `Umroh Plus`, `Haji Plus`, `Haji Khusus`
- `Visa`, `Tiket`, `Paspor`, `Passport`
- `Asuransi`, `Jaminan`, `Guarantee`

## 🚀 **KEY FEATURES**

1. **Flexible Formatting**: Multiple ways to express the same request
2. **Natural Language**: Chat like you're talking to a human
3. **Automatic Work Type Detection**: Recognizes common job types
4. **Multi-language Support**: Indonesian and English
5. **Various Separators**: Supports commas, dashes, numbers, spaces
6. **Error Tolerance**: Handles typos and variations gracefully
7. **Real-time Processing**: Instant database updates

## 💡 **TIPS FOR USERS**

- Be consistent with PT names for better search results
- Use clear item names (e.g., "KTP" instead of just "K")
- For complex lists, use numbered format: `1. KTP 2. NPWP`
- Include work type when relevant: `PPIU: KTP, Paspor, SK`
- Mix and match formats that feel most natural to you

## 🔄 **BACKWARD COMPATIBILITY**

All existing formats continue to work:
- Traditional commands (.data, .1, .2, etc.)
- Menu-based navigation
- Direct database operations

The AI simply adds a more natural, conversational interface on top!