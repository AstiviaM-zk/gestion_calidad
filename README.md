# QMS Backend & Auth Portal

Sistema de Gestión de Calidad (QMS) - Backend en Express y Portal de Inicio de Sesión con **Google OAuth 2.0**.

---

## 🚀 Comandos Rápidos para Iniciar el Servidor

Abre la terminal en la raíz del proyecto (`qms-backend`) y ejecuta alguno de los siguientes comandos:

### Modo Desarrollo (con reinicio automático al editar archivos):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

Una vez iniciado, abre tu navegador en:  
 **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Configuración del Archivo `.env`

El proyecto utiliza variables de entorno definidas en el archivo `.env`. Puedes copiar el archivo de ejemplo para comenzar:

```bash
cp .env.example .env
```

---

## 📂 Estructura del Proyecto

```text
qms-backend/
├── index.js              # Punto de entrada principal de Express
├── package.json          # Configuración de scripts y dependencias
├── .env                  # Variables de entorno locales
├── .env.example          # Plantilla de variables de entorno
├── README.md             # Documentación del proyecto
├── src/
│   └── routes/
│       └── auth.js       # Router de autenticación (Google OAuth + JWT)
└── public/               # Interfaz Frontend (Glassmorphic Web UI)
    ├── index.html        # Página HTML5 principal
    ├── css/
    │   └── styles.css    # Estilos CSS nativos (Dark glassmorphism)
    └── js/
        └── app.js        # Lógica del cliente Javascript (Google GIS SDK)
```
