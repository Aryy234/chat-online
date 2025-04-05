# Juego de Mecanografía Multijugador

Aplicación multijugador simple que permite a los jugadores crear salas, unirse a ellas mediante un código, y chatear en tiempo real.

## Características

- Creación de salas con códigos únicos
- Unirse a salas existentes mediante el código
- Chat en tiempo real entre los jugadores
- Interfaz responsive
- Sin necesidad de registro o base de datos

## Tecnologías utilizadas

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Comunicación en tiempo real: Socket.IO

## Estructura del proyecto

```
mecanografy-game/
├── server/                 # Servidor Node.js + Socket.IO
│   ├── index.ts            # Punto de entrada del servidor
│   ├── package.json        # Dependencias del servidor
│   ├── tsconfig.json       # Configuración TypeScript para el servidor
│   └── server.test.ts      # Pruebas del servidor
│
├── src/                    # Aplicación frontend (React)
│   ├── components/         # Componentes React
│   │   ├── Lobby.tsx       # Componente para crear/unirse a salas
│   │   └── ChatRoom.tsx    # Componente para la sala de chat
│   ├── context/            # Contextos React
│   │   └── SocketContext.tsx  # Contexto para Socket.IO
│   ├── types/              # Definiciones de TypeScript
│   │   └── index.ts        # Interfaces compartidas
```

## Cómo ejecutar el proyecto

### Instalar dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del servidor
cd server
npm install
cd ..
```

### Iniciar el servidor

```bash
cd server
npm run dev
```

### Iniciar el cliente

```bash
# En otra terminal
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Cómo usar la aplicación

1. **Crear una sala:**
   - Ingresa tu nombre
   - Haz clic en "Crear Sala"
   - Comparte el código de sala generado con tus amigos

2. **Unirse a una sala:**
   - Ingresa tu nombre
   - Ingresa el código de sala que te compartieron
   - Haz clic en "Unirse a Sala"

3. **Chatear:**
   - Una vez en la sala, usa el campo de texto en la parte inferior para enviar mensajes
   - Verás la lista de usuarios conectados en el panel izquierdo

## Pruebas

Para ejecutar las pruebas:

```bash
# Pruebas del cliente
npm run test

# Pruebas del servidor
cd server
npm run test
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
