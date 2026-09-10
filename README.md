# Sistema de Gestión de Calidad (QMS)

Aplicación web desacoplada para la administración de documentos de calidad ISO 9001, control de versiones, usuarios autenticados mediante Google OAuth2 y matriz de Roles y Permisos.

## 📁 Estructura del Proyecto

```text
gestion_calidad/
├── backend/                  # Servidor API Express + Node.js
│   ├── data/                 # Persistencia JSON (users.json)
│   ├── src/                  # Controlador de Rutas y Servicios
│   ├── .env                  # Variables de entorno
│   ├── index.js              # Punto de entrada del Backend
│   └── package.json
│
├── frontend/                 # Aplicación SPA Vue 3 + Vite
│   ├── public/               # Archivos estáticos
│   ├── src/
│   │   ├── assets/           # Estilos CSS institucionales
│   │   ├── components/       # Componentes reutilizables (DocumentManager, UserList, RoleManager, etc.)
│   │   ├── views/            # Vistas principales (LoginView, DashboardView)
│   │   ├── App.vue           # Componente raíz
│   │   └── main.js           # Entrada de Vue 3
│   ├── index.html            # Plantilla HTML Vite
│   ├── vite.config.js        # Configuración de Vite con Proxy /api
│   └── package.json
│
├── package.json              # Orquestador con concurrently (npm run dev)
└── README.md
```

## 🚀 Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Ejecutar en modo Desarrollo (Backend + Frontend)**:
   ```bash
   # En la raíz del proyecto:
   npm run dev
   ```
   - **Frontend (Vite)**: http://localhost:5173/
   - **Backend (API)**: http://localhost:3000/
