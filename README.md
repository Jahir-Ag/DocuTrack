# DocuTrack

**DocuTrack** es una plataforma web diseñada para digitalizar, agilizar y centralizar el proceso de solicitud, seguimiento y emisión de certificados oficiales. Ofrece una experiencia fluida tanto para ciudadanos como para administradores, optimizando la tramitación de documentos desde cualquier lugar.

---

## 🌐 Demo en Producción

- **Frontend:** Desplegado en Vercel
- **Backend API:** Desplegado en Railway

---

## 📌 Características Principales

### Para Ciudadanos

- **Registro y Login seguro** con autenticación basada en JWT.
- **Formulario de solicitud** de certificados con carga de archivos adjuntos (PDF/JPG).
- **Seguimiento del estado del trámite** en tiempo real (`Recibido → En Validación → Emitido`).
- **Descarga automática del certificado en PDF** una vez aprobado.

### Para Administradores

- **Panel de gestión de trámites** con lista completa de solicitudes.
- **Revisión detallada de cada trámite**, con acceso a datos del solicitante y documentos.
- **Acciones administrativas**: Aprobar, Rechazar o Solicitar correcciones, lo que actualiza el estado para el usuario.

---

## ⚙️ Tecnologías Utilizadas

| Capa       | Tecnología             | Justificación                                                                 |
|------------|------------------------|------------------------------------------------------------------------------|
| Frontend   | React.js               | Librería moderna, modular y eficiente para SPAs.                            |
| Backend    | Node.js + Express      | Ligero, rápido y ampliamente utilizado para servicios REST.                 |
| ORM        | Prisma ORM             | Abstracción robusta para PostgreSQL con tipado fuerte y migraciones seguras.|
| Base de Datos | PostgreSQL          | SGBD relacional robusto y escalable.                                        |
| Autenticación | JWT                 | Para proteger rutas y manejar sesiones seguras.                             |
| Generación PDF | pdf-lib (u otra)   | Para generar certificados dinámicamente con datos del solicitante.          |
| Despliegue Frontend | Vercel        | CI/CD sencillo y escalabilidad automática.                                  |
| Despliegue Backend | Railway        | Hosting eficiente con soporte PostgreSQL integrado.                         |

---

## 🗂️ Estructura del Proyecto

```
DocuTrack/
│
├── backend/               # API REST (Node.js + Express + Prisma)
│   ├── server.js          # Entrada principal del servidor
│   ├── db.js              # Conexión con la base de datos
│   ├── prisma/            # Esquema Prisma y migraciones
│   └── routes/            # Endpoints para usuarios, admins y trámites
│
└── frontend/              # Aplicación React
    ├── components/        # Componentes reutilizables
    ├── pages/             # Rutas de usuario y administrador
    └── services/          # Lógica de conexión con la API
```

---

## 🛠️ Instalación y Ejecución Local

### Requisitos

- Node.js (v18+)
- PostgreSQL
- npm o yarn

### 1. Clona el repositorio

```bash
git clone https://github.com/tuusuario/docutrack.git
cd docutrack
```

### 2. Backend

```bash
cd backend
cp .env.example .env  # Asegúrate de configurar tus variables de entorno
npm install
npx prisma generate
npx prisma migrate dev --name init
npm start
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔐 Seguridad y Acceso

- Autenticación con **JWT** para proteger rutas privadas.
- Sistema de roles: **USER** y **ADMIN**, con verificación de permisos en el backend.

---

## 📄 Certificados Dinámicos

Los certificados emitidos se generan como archivos PDF personalizados con los datos ingresados por el ciudadano. Están disponibles para descarga una vez el trámite es aprobado.

---

## 🧠 Futuras Mejoras

- Notificaciones automáticas por correo electrónico.
- Firma digital en certificados.
- Historial completo de trámites por usuario.
- Panel de métricas para administradores.

---

## 🤝 Autor

- [Jahir Agudo](https://github.com/Jahir-Ag)
- Desarrollador Full Stack

---
