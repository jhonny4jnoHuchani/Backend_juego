# TESIS QUEST Backend — Guía de Despliegue en Producción

Guía para desplegar el backend NestJS en un servidor **Ubuntu 22.04 LTS**.

---

## Índice

1. [Requisitos previos del servidor](#1-requisitos-previos-del-servidor)
2. [Clonar el repositorio](#2-clonar-el-repositorio)
3. [Configurar el backend](#3-configurar-el-backend)
4. [Nginx (reverse proxy + SSL)](#4-nginx-reverse-proxy--ssl)
5. [Mantenimiento](#5-mantenimiento)
6. [Troubleshooting](#6-troubleshooting)
7. [Checklist final de despliegue](#7-checklist-final-de-despliegue)

---

## 1. Requisitos previos del servidor

| Herramienta | Versión recomendada | Verificar con |
|---|---|---|
| Node.js | 20.x LTS | `node -v` |
| npm | 10.x (viene con Node 20) | `npm -v` |
| MySQL | 8.0+ | `mysql --version` |
| Git | 2.x | `git --version` |
| PM2 | última (global) | `pm2 -v` |
| Nginx | 1.18+ (opcional, para proxy y SSL) | `nginx -v` |

### Instalación de Node.js 20 (vía NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # debe mostrar v20.x
```

### Instalación de MySQL 8

```bash
sudo apt update
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Instalación de Git, PM2 y Nginx

```bash
sudo apt install -y git nginx
sudo npm install -g pm2
```

> **Nota de seguridad:** no uses el usuario `root` del sistema para correr la aplicación. Crea un usuario dedicado (ej. `deploy`) con permisos limitados.

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
su - deploy
```

---

## 2. Clonar el repositorio

```bash
cd ~
git clone <URL_DE_TU_REPOSITORIO> tesis-quest-backend
cd tesis-quest-backend
```

---

## 3. Configurar el backend

### 3.1. Instalar dependencias

```bash
npm install
```

### 3.2. Crear la base de datos en MySQL

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE tesis_quest
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'tesis_quest_user'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CONTRASENA';
GRANT ALL PRIVILEGES ON tesis_quest.* TO 'tesis_quest_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3.3. Crear el archivo `.env`

```bash
nano .env
```

```env
# ── Entorno ──────────────────────────────────────────
NODE_ENV=production
PORT=3000

# ── Base de datos ────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=tesis_quest_user
DB_PASS=CAMBIA_ESTA_CONTRASENA
DB_NAME=tesis_quest

# ── Autenticación JWT ────────────────────────────────
JWT_SECRET=genera_un_secreto_largo_y_aleatorio_aqui
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=otro_secreto_distinto_igual_de_largo
JWT_REFRESH_EXPIRES=7d

# ── IA evaluadora ────────────────────────────────────
GEMINI_API_KEY=tu_api_key_de_gemini
GROQ_API_KEY=tu_api_key_de_groq

# ── CORS ─────────────────────────────────────────────
CORS_ORIGIN=https://tu-dominio.com
```

Genera secretos JWT seguros con:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> ⚠️ **Nunca subas `.env` a git.** Verifica que esté en `.gitignore`:
> ```bash
> grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
> ```

### 3.4. Correr los seeds (datos iniciales)

Con la base de datos vacía, corre todos los seeds en orden:

```bash
npm run seed:all
```

Esto ejecuta, en orden: `seed` (modalidades base) → `seed:tesis` (niveles de Tesis) → `seed:tesis:misiones` (misiones) → `seed:teorias` (teoría breve por misión).

> Solo corre los seeds **una vez**, al desplegar por primera vez o si reseteas la base de datos. Confirma si tus scripts son idempotentes antes de repetirlos sobre datos existentes, para no duplicar registros.

### 3.5. Compilar y arrancar con PM2

```bash
npm run build
pm2 start dist/main.js --name tesis-quest-api
pm2 save
pm2 startup   # sigue la instrucción que imprime, para que PM2 arranque solo al reiniciar el servidor
```

### 3.6. Verificar que corre

```bash
pm2 status
pm2 logs tesis-quest-api --lines 50
curl http://localhost:3000/health
```

---

## 4. Nginx (reverse proxy + SSL)

Aunque el backend puede exponerse directo en el puerto 3000, lo recomendable es ponerlo detrás de Nginx para manejar SSL y tener un dominio limpio.

### 4.1. Configuración del sitio

```bash
sudo nano /etc/nginx/sites-available/tesis-quest-api
```

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/tesis-quest-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2. SSL con Let's Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.tu-dominio.com
```

Certbot edita automáticamente el bloque de Nginx para forzar HTTPS y configura la renovación automática. Verifica con:

```bash
sudo certbot renew --dry-run
```

> ⚠️ Con SSL activo, actualiza `CORS_ORIGIN` en el `.env` a `https://` y avisa al equipo de frontend para que apunten su `EXPO_PUBLIC_API_URL` al nuevo dominio con `https://`.

---

## 5. Mantenimiento

| Tarea | Comando |
|---|---|
| Reiniciar el backend | `pm2 restart tesis-quest-api` |
| Reiniciar recargando variables de `.env` | `pm2 restart tesis-quest-api --update-env` |
| Ver logs en vivo | `pm2 logs tesis-quest-api` |
| Ver últimas 100 líneas | `pm2 logs tesis-quest-api --lines 100 --nostream` |
| Ver estado de todos los procesos | `pm2 status` |
| Detener el backend | `pm2 stop tesis-quest-api` |
| Eliminar el proceso de PM2 | `pm2 delete tesis-quest-api` |
| Recargar Nginx tras cambiar config | `sudo systemctl reload nginx` |

### Actualizar código

```bash
cd ~/tesis-quest-backend
git pull origin main
npm install
npm run build
pm2 restart tesis-quest-api
```

### Correr seeds nuevamente (solo si es necesario)

```bash
npm run seed:all
```

> Úsalo con cuidado en un servidor con datos reales de usuarios — confirma primero si los seeds son seguros de repetir sin duplicar registros.

---

## 6. Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| `Error: listen EADDRINUSE :::3000` | El puerto 3000 ya está en uso | `sudo lsof -i :3000` para ver qué proceso lo ocupa, y `pm2 delete` cualquier instancia duplicada |
| Backend no conecta a MySQL | Credenciales incorrectas en `.env`, o MySQL no está corriendo | `sudo systemctl status mysql`; probar conexión manual: `mysql -u tesis_quest_user -p -h localhost tesis_quest` |
| `JsonWebTokenError: invalid signature` | `JWT_SECRET` cambió después de emitir tokens | Los tokens viejos quedan inválidos si cambias el secreto; los usuarios deben volver a loguearse |
| `502 Bad Gateway` en Nginx | El backend (PM2) no está corriendo | `pm2 status` y `pm2 logs tesis-quest-api` para ver el error real |
| Certbot falla al emitir certificado | El dominio no apunta aún a la IP del servidor | Verifica DNS con `dig api.tu-dominio.com` antes de reintentar |
| La IA evaluadora no responde | `GEMINI_API_KEY` o `GROQ_API_KEY` inválida o sin cuota | Revisa logs (`pm2 logs`) buscando errores 401/429 de esas APIs |
| Cambios en `.env` no toman efecto | PM2 sigue corriendo el proceso viejo con variables antiguas en memoria | `pm2 restart tesis-quest-api --update-env` |
| CORS bloqueando peticiones del frontend | `CORS_ORIGIN` no coincide con el dominio real del frontend | Verifica que `CORS_ORIGIN` en `.env` sea exactamente el origen que usa el frontend (protocolo incluido) |

### Verificación rápida de servicios

```bash
pm2 status                                       # backend corriendo
sudo systemctl status mysql                      # MySQL corriendo
sudo systemctl status nginx                      # Nginx corriendo (si aplica)
curl http://localhost:3000/health                # backend responde localmente
curl https://api.tu-dominio.com/health           # backend responde vía Nginx/dominio
mysql -u tesis_quest_user -p -e "SHOW TABLES;" tesis_quest   # tablas existen
```

---

## 7. Checklist final de despliegue

- [ ] Servidor Ubuntu 22.04 actualizado (`sudo apt update && sudo apt upgrade -y`)
- [ ] Usuario `deploy` creado (no usar `root` para correr la app)
- [ ] Node.js 20.x instalado y verificado
- [ ] MySQL 8 instalado, `mysql_secure_installation` corrido
- [ ] Git, PM2 y Nginx instalados
- [ ] Repositorio clonado
- [ ] Base de datos `tesis_quest` y usuario MySQL dedicado creados
- [ ] `.env` creado con todas las variables (DB, JWT, IA, CORS)
- [ ] `.env` agregado a `.gitignore`
- [ ] `npm install` corrido
- [ ] Seeds corridos (`npm run seed:all`)
- [ ] Backend compilado (`npm run build`) y arrancado con PM2
- [ ] `pm2 save` y `pm2 startup` configurados (para que sobreviva a reinicios del servidor)
- [ ] Backend responde en `curl http://localhost:3000/health`
- [ ] Nginx configurado como reverse proxy (si aplica)
- [ ] `sudo nginx -t` sin errores y `systemctl reload nginx` aplicado
- [ ] Dominio apuntando a la IP del servidor (verificado con `dig`)
- [ ] Certificado SSL emitido con Certbot (si aplica)
- [ ] `CORS_ORIGIN` actualizado a `https://` y coincide con el origen real del frontend
- [ ] Prueba end-to-end: `curl` a un endpoint real (ej. login) desde fuera del servidor
- [ ] Backup inicial de la base de datos hecho (`mysqldump`)

---

## Notas de seguridad

- **Nunca** subas `.env` a git — contiene secretos JWT y API keys de IA.
- Usa contraseñas fuertes y distintas para el usuario de MySQL y los secretos JWT (no reutilices el mismo string).
- Sirve todo por **HTTPS** una vez tengas el dominio y el certificado.
- Restringe el acceso a MySQL solo a `localhost` (ya está así en la config de arriba) a menos que necesites conexión remota explícita.
- Considera activar `ufw` (firewall) permitiendo solo los puertos 22 (SSH), 80 y 443:
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```