DocuTrack

DocuTrack is a web platform designed to digitize, streamline, and centralize the process of requesting, tracking, and issuing official certificates. It provides a smooth experience for both citizens and administrators, optimizing document processing from anywhere.

🌐 Production Demo

Frontend: Deployed on Vercel

Backend API: Deployed on Railway

📌 Key Features
For Citizens

Secure Registration and Login with JWT-based authentication.

Certificate request form with file upload support (PDF/JPG).

Real-time tracking of request status (Received → Under Validation → Issued).

Automatic PDF download of the certificate once approved.

For Administrators

Management dashboard with a complete list of requests.

Detailed review of each request, with access to applicant data and documents.

Administrative actions: Approve, Reject, or Request corrections, automatically updating the status for the user.

## ⚙️ Technologies Used
Layer	Technology	Reason
Frontend	React.js	Modern, modular, and efficient library for SPAs.
Backend	Node.js + Express	Lightweight, fast, and widely used for REST services.
ORM	Prisma ORM	Strong abstraction for PostgreSQL with type safety and secure migrations.
Database	PostgreSQL	Robust and scalable relational DBMS.
Authentication	JWT	To secure routes and manage sessions safely.
PDF Generation	pdf-lib (or similar)	To dynamically generate certificates with applicant data.
Frontend Deployment	Vercel	Simple CI/CD and automatic scalability.
Backend Deployment	Railway	Efficient hosting with built-in PostgreSQL support.


## 🗂️ Project Structure
DocuTrack/
│
├── backend/               # REST API (Node.js + Express + Prisma)
│   ├── server.js          # Main server entry point
│   ├── db.js              # Database connection
│   ├── prisma/            # Prisma schema and migrations
│   └── routes/            # Endpoints for users, admins, and requests
│
└── frontend/              # React application
    ├── components/        # Reusable components
    ├── pages/             # User and admin routes
    └── services/          # API connection logic


## 🛠️ Installation and Local Setup
Requirements

Node.js (v18+)

PostgreSQL

npm or yarn

1. Clone the repository
git clone https://github.com/Jahir-Ag/DocuTrack.git
cd docutrack

2. Backend Setup
cd backend
cp .env.example .env  # Make sure to configure your environment variables
npm install
npx prisma generate
npx prisma migrate dev --name init
npm start

3. Frontend Setup
cd ../frontend
npm install
npm run dev

🔐 Security and Access

JWT authentication to protect private routes.

Role system: USER and ADMIN, with permission verification handled in the backend.

📄 Dynamic Certificates

Certificates are generated as custom PDF files containing the citizen’s data.
They are available for download once the request has been approved.



## 🚀 Deployment

- [DocuTrack](https://docu-track-beta.vercel.app/)
- Frontend: Vercel
- Backend: Railway
- Database: PostgreSQL


## 🤝 Author

- [Jahir Agudo](https://github.com/Jahir-Ag)
- Full Stack developer 

---
