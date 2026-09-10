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
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Configuración del Archivo `.env`

El proyecto utiliza variables de entorno definidas en el archivo `.env`. Puedes copiar el archivo de ejemplo para comenzar:

```bash
cp .env.example .env
```

### Variables disponibles:

| Variable | Descripción | Valor Por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto en el que se ejecuta el servidor Express | `3000` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth 2.0 obtenido en Google Cloud Console | `YOUR_GOOGLE_CLIENT_ID...` |
| `JWT_SECRET` | Clave secreta para firmar los tokens de sesión del usuario | `qms_backend_super_secret...` |

---

## 🔑 Configurar Autenticación Real de Google Cloud

Para habilitar el inicio de sesión real con cuentas de Google:

1. Ve a la **[Consola de Google Cloud](https://console.cloud.google.com/)**.
2. Crea un proyecto (o selecciona uno existente) y ve a **APIs & Services > Credentials**.
3. Haz clic en **Create Credentials > OAuth client ID**.
4. Selecciona tipo de aplicación: **Web application**.
5. En **Authorized JavaScript origins** (Orígenes de JavaScript autorizados), añade los siguientes orígenes exactos (sin `/` al final):
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
6. Copia el **Client ID** generado y pégalo en tu archivo `.env`:
   ```env
   GOOGLE_CLIENT_ID=1234567890-abcdef.apps.googleusercontent.com
   ```
7. Haz clic en **Guardar** en la consola de Google. *(Nota: Los cambios en Google Cloud pueden tardar de 1 a 5 minutos en propagarse)*.

> [!TIP]
> **Solución a `Error 400: origin_mismatch`:**
> Este error ocurre si la URL donde tienes abierta la aplicación en el navegador (ej: `http://localhost:3000` o `http://127.0.0.1:3000`) no está exactamente agregada en la lista de **Orígenes de JavaScript autorizados** en Google Cloud Console. Asegúrate de agregar ambas variantes sin barra final.

---

## 🛰️ Endpoints de la API

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado de salud del servidor |
| `GET` | `/api/auth/config` | Obtiene la configuración pública (Google Client ID) |
| `POST` | `/api/auth/google` | Recibe la credencial (ID Token) de Google, la valida y emite un token JWT |
| `GET` | `/api/auth/me` | Retorna los datos del usuario logueado según la cabecera `Authorization: Bearer <token>` |

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
