# BRIRoom - Room & Zoom Booking System

Aplikasi booking ruangan dan Zoom meeting untuk BRI yang dikembangkan dengan Node.js Express (Backend) dan React Vite (Frontend).

## Fitur Utama

### 👤 **User (Pegawai)**
- Login dengan akun yang tersedia
- Mengajukan permintaan booking ruangan/Zoom
- Melihat status permintaan
- Edit/Cancel permintaan yang masih pending
- Dashboard dengan statistik pribadi

### 🏢 **Logistik**
- Melihat semua permintaan ruangan
- Approve/Reject permintaan ruangan
- Dashboard dengan statistik permintaan
- Notifikasi otomatis ke user

### 💻 **Admin IT**
- Kelola master data ruangan
- Kelola akun Zoom
- Approve permintaan Zoom secara manual
- Dashboard overview sistem

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL Database
- JWT Authentication
- bcrypt untuk password hashing

**Frontend:**
- React 19 + Vite
- Tailwind CSS
- Axios untuk HTTP requests
- React Router DOM

## Setup Development

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- Git

### 2. Clone Repository
```bash
git clone <repository-url>
cd BRIRoom-Development
```

### 3. Setup Database
1. Buat database PostgreSQL bernama `briroom_db`
2. Import schema dari file `briroom-be/database/schema.sql`
```bash
psql -U postgres -d briroom_db -f briroom-be/database/schema.sql
```

### 4. Setup Backend
```bash
cd briroom-be
npm install
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi database Anda:
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=briroom_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 5. Setup Frontend
```bash
cd ../briroom-fe
npm install
```

### 6. Jalankan Aplikasi

**Backend:**
```bash
cd briroom-be
npm run dev
```
Server akan berjalan di http://localhost:5000

**Frontend:**
```bash
cd briroom-fe
npm run dev
```
Aplikasi akan berjalan di http://localhost:5173

## Default Login Accounts

Setelah import schema, gunakan akun berikut untuk testing:

### Admin IT
- **Email:** admin@bri.co.id
- **Password:** password

### Logistik
- **Email:** logistik@bri.co.id
- **Password:** password

### User
- **Email:** user@bri.co.id
- **Password:** password

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user

### Requests (User)
- `POST /api/requests` - Buat permintaan baru
- `GET /api/requests/me` - Lihat permintaan saya
- `GET /api/requests/me/:id` - Detail permintaan
- `PUT /api/requests/me/:id` - Edit permintaan
- `PATCH /api/requests/me/:id/cancel` - Cancel permintaan

### Room Management (Logistik)
- `GET /api/requests/room-requests` - Lihat permintaan ruangan
- `PATCH /api/requests/room/:id/approve` - Approve permintaan
- `PATCH /api/requests/room/:id/reject` - Reject permintaan

### Admin Management (Admin IT)
- `GET /api/admin/rooms` - Lihat ruangan
- `POST /api/admin/rooms` - Tambah ruangan
- `PUT /api/admin/rooms/:id` - Edit ruangan
- `DELETE /api/admin/rooms/:id` - Hapus ruangan
- `GET /api/admin/zoom-links` - Lihat akun Zoom
- `POST /api/admin/zoom-links` - Tambah akun Zoom
- `PUT /api/admin/zoom-links/:id` - Edit akun Zoom
- `DELETE /api/admin/zoom-links/:id` - Hapus akun Zoom

### Notifications
- `GET /api/notifications/me` - Lihat notifikasi

## Database Schema

### Tables:
- **users** - Data pengguna (user, admin_it, logistik)
- **rooms** - Master data ruangan
- **zoom_links** - Master data akun Zoom
- **requests** - Permintaan booking
- **notifications** - Notifikasi untuk user
- **request_status_logs** - Log perubahan status

## Business Logic

### Booking Rules:
1. **Room Booking:**
   - User dapat pilih ruangan spesifik atau biarkan sistem pilih otomatis
   - Sistem cek availability berdasarkan tanggal, waktu, dan kapasitas
   - Logistik approve/reject permintaan ruangan

2. **Zoom Booking:**
   - User dapat pilih akun Zoom spesifik atau biarkan sistem pilih otomatis
   - Sistem cek availability berdasarkan tanggal dan waktu
   - Admin IT approve permintaan Zoom secara manual

3. **Both (Room + Zoom):**
   - Validasi kedua resource
   - Butuh approval dari logistik (ruangan) dan admin IT (Zoom)

### Status Flow:
```
pending → approved/rejected
pending → cancelled (user cancel)
```

### Notifications:
- Auto notification saat status berubah
- WhatsApp integration (dummy, bisa dikembangkan)

## Development Notes

### Frontend Features Completed:
✅ Login/Authentication  
✅ User Dashboard with stats  
✅ Request submission form  
✅ My requests list  
✅ Logistik dashboard  
✅ Admin dashboard  
✅ Private routing  

### Backend Features Completed:
✅ Authentication & Authorization  
✅ Request CRUD  
✅ Room management  
✅ Zoom management  
✅ Notification system  
✅ Status logging  
✅ Auto room/zoom assignment  

### TODOs untuk Enhancement:
- [ ] Request detail modal/page
- [ ] Edit request functionality
- [ ] Real WhatsApp integration
- [ ] Email notifications
- [ ] Advanced filtering & search
- [ ] Calendar view
- [ ] Report generation
- [ ] Bulk operations
- [ ] File upload (agenda documents)

## Troubleshooting

### Database Connection Error:
- Pastikan PostgreSQL running
- Check credentials di .env
- Pastikan database `briroom_db` sudah dibuat

### CORS Error:
- Pastikan backend dan frontend running di port yang benar
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Authentication Error:
- Check JWT_SECRET di .env
- Clear localStorage di browser
- Re-login dengan akun yang benar

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

Internal BRI Project - Confidential
