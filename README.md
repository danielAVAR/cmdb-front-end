# cmdb-front-end
The_Carlos_Movie_Database_front_End



```
cmdb-front-end/
├── index.html              # Inicio
├── pages/
│   ├── login.html          # Login y registro
│   ├── movies.html         # Listado con filtros y ordenamiento
│   ├── movie-detail.html   # Detalle, reseñas y votos
│   └── admin.html          # Panel admin: categorías y aprobaciones
├── css/
│   ├── base.css            # Reset, variables de color, tipografía
│   ├── layout.css          # Header, grid, breakpoints responsive
│   └── components.css      # Botones, tarjetas, formularios, alertas
├── js/
│   ├── config.js           # API_BASE_URL (único lugar donde cambia la URL)
│   ├── auth.js             # Guardar y leer token y rol, logout, guard de páginas
│   ├── api/
│   │   ├── client.js       # Función base con fetch, token y manejo de errores
│   │   ├── auth.api.js     # register, login
│   │   ├── movies.api.js
│   │   ├── categories.api.js
│   │   └── reviews.api.js
│   ├── ui/
│   │   ├── nav.js          # Menú distinto según sesión y rol
│   │   ├── alerts.js       # Muestra mensajes del backend
│   │   └── form-errors.js  # Muestra errores de validación por campo
│   └── pages/
│       ├── home.js
│       ├── login.js
│       ├── movies.js
│       ├── movie-detail.js
│       └── admin.js
├── assets/
│   └── images/
├── .gitignore
└── README.md

```

