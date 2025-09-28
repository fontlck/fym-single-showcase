# Single Showcase (ลงทะเบียนคนโสด)

เว็บแอป 3 ส่วน:
- `/submit` ฟอร์มให้ผู้ใช้กรอก IG + อัพโหลดรูป + แคปชัน
- `/present` หน้าพรีเซนต์ 1920x1080 วนรูปอัตโนมัติทุก 5 วินาที (ตั้งค่าได้)
- `/admin` แอดมินตั้งค่า Event / ธีม / อนุมัติ‑ซ่อนรายการ / เลือก Event ปัจจุบัน

Tech: React + Vite + Tailwind + Firebase (Firestore + Storage + Auth)

---

## 0) วิธีรัน
```bash
npm install
npm run dev
```
> ก่อนรัน ให้สร้างไฟล์ `.env` จาก `.env.sample` และใส่ค่า Firebase Web App

---

## 1) เตรียม Firebase (Console)
1. ไปที่ https://console.firebase.google.com/ → **Add project**
2. ตั้งชื่อโปรเจค (เช่น `single-showcase`) → Create project
3. ที่หน้า **Project Overview** คลิกไอคอนเว็บ `</>` → Register app
   - App nickname: `single-showcase-web`
   - ไม่ต้อง Hosting ตอนนี้ก็ได้
   - จะได้ **Firebase config** (apiKey, authDomain, projectId, storageBucket, ...)
4. คัดลอกค่าจากข้อ 3 ไปใส่ในไฟล์ `.env`:
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=1:xxxx:web:xxxx
```

### เปิดบริการที่ใช้
- **Authentication** → Get started → **Sign-in method** → เปิด **Email/Password**
- **Firestore Database** → Create database → Start in **production mode**
- **Storage** → Get started → ที่ **Rules** จะปรับตามด้านล่าง

---

## 2) ตั้งค่า Security Rules (ตัวอย่างสำหรับงานอีเวนต์)
> หมายเหตุ: เพื่อความง่าย อนุญาตให้ **บุคคลทั่วไปส่งข้อมูลได้** แต่ห้ามแก้/ลบ และอัพโหลดไฟล์ภาพเท่านั้น พร้อมจำกัดขนาดไฟล์.
> เหมาะกับงานอีเวนต์เฉพาะกิจ หากใช้จริงระยะยาว แนะนำเพิ่ม **Firebase App Check** และทำแบบฟอร์มหลังบ้านที่ใช้ Auth

### 2.1 Firestore Rules
ไปที่ Firestore → Rules แล้ววางโค้ดนี้:
```
// Allow public create to 'submissions' but no update/delete.
// Admin (signed-in) can read everything.
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    // Submissions
    match /submissions/{doc} {
      allow create: if request.resource.data.keys().hasAll(['ig','caption','imageUrl','eventId','approved','createdAt'])
                    && request.resource.data.ig is string
                    && request.resource.data.caption is string
                    && request.resource.data.imageUrl is string
                    && request.resource.data.eventId is string
                    && request.resource.data.approved is bool;
      allow read: if true;
      allow update, delete: if isSignedIn();
    }

    // Events & meta can be read by anyone (presentation), write by admin only
    match /events/{doc} {
      allow read: if true;
      allow write: if isSignedIn();
    }
    match /meta/{doc} {
      allow read: if true;
      allow write: if isSignedIn();
    }
  }
}
```

### 2.2 Storage Rules
ไปที่ Storage → Rules แล้ววางโค้ดนี้:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }
    match /events/{eventId}/uploads/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    // Everything else: admin only
    match /{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
  }
}
```
> ความเสี่ยง: เปิดให้ใครก็อัพภาพได้ (จำกัด 5MB และ image/*) – เหมาะกับงานอีเวนต์ที่ควบคุมหน้างาน หากต้องการเข้มงวด ควรใช้ Auth หรือ App Check, หรือทำ Cloud Function ตรวจไฟล์เพิ่มเติม

---

## 3) สร้าง Admin User
- ไปที่ **Authentication → Users → Add user**
- ใส่ email/password สำหรับแอดมินเพื่อเข้าหน้าที่ `/admin`

---

## 4) สร้าง Event แรก + ตั้งเป็น Current
1. เปิดเว็บโลคัล `npm run dev` → ไปที่ `/admin`
2. ล็อกอินด้วยอีเมล/พาสที่สร้างไว้
3. ที่ส่วน **Events** → ตั้งชื่อ → **Create**
4. กด **Set current** กับอีเวนต์ที่ต้องการ
5. ปรับ Theme/Interval แล้วกด **Save**

> ระบบจะบันทึกค่า current event ไว้ที่ `meta/global.currentEventId`

---

## 5) เริ่มใช้งาน
- แจกลิงก์ **ฟอร์ม**: `/submit`
- ฉาย **Presentation**: เปิดหน้าจอที่ `/present` (หรือระบุ `?event=<id>`)
- Presentation จะ **วนภาพทุก 5 วินาที** (ค่าเริ่มต้น) และดึงธีมจาก Event

---

## 6) โครงสร้างข้อมูล
- **collections**
  - `events/{eventId}`
    - `name: string`
    - `slideIntervalMs: number` (default 5000)
    - `theme: { bgColor, textColor, accentColor, overlayColor }`
    - `createdAt: serverTimestamp`
  - `meta/global`
    - `currentEventId: string`
  - `submissions/{id}`
    - `ig: string`
    - `caption: string`
    - `imageUrl: string`
    - `eventId: string`
    - `approved: boolean`
    - `createdAt: serverTimestamp`

---

## 7) Deploy (ทางเลือก)
### 7.1 Vercel
1. สร้าง GitHub repo แล้ว push โค้ดนี้
2. ไป Vercel → New Project → Import repo
3. ใส่ Environment Variables ตาม `.env`
4. Deploy

### 7.2 Firebase Hosting
1. ติดตั้ง CLI: `npm i -g firebase-tools`
2. `firebase login`
3. `firebase init hosting` (เลือกโปรเจค, set dist dir = `dist`)
4. Build: `npm run build`
5. Deploy: `firebase deploy`

---

## ทิปส์
- ปรับขนาดรูปก่อนอัพโหลดเพื่อความเร็ว (เช่น 1920x1080) – ปัจจุบันไม่บังคับ
- ถ้าต้องการควบคุมการส่งซ้ำ/สแปม แนะนำเปิด App Check หรือใส่ rate limit ฝั่ง Cloud Functions
- Presentation รองรับพารามิเตอร์ `?event=<id>` เผื่อเปิดหลายจอคนละอีเวนต์

Good luck! 🎉
