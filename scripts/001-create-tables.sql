-- Tabla de películas
CREATE TABLE IF NOT EXISTS peliculas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  sinopsis TEXT,
  duracion INTEGER NOT NULL,
  genero VARCHAR(100),
  clasificacion VARCHAR(20),
  director VARCHAR(255),
  imagen_url TEXT,
  trailer_url TEXT,
  fecha_estreno DATE,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de salas
CREATE TABLE IF NOT EXISTS salas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  filas INTEGER NOT NULL DEFAULT 10,
  columnas INTEGER NOT NULL DEFAULT 15,
  capacidad INTEGER GENERATED ALWAYS AS (filas * columnas) STORED,
  tipo VARCHAR(50) DEFAULT 'standard',
  activa BOOLEAN DEFAULT true
);

-- Tabla de funciones
CREATE TABLE IF NOT EXISTS funciones (
  id SERIAL PRIMARY KEY,
  pelicula_id INTEGER REFERENCES peliculas(id) ON DELETE CASCADE,
  sala_id INTEGER REFERENCES salas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 12000,
  formato VARCHAR(50) DEFAULT '2D',
  idioma VARCHAR(50) DEFAULT 'Español',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de tiquetes
CREATE TABLE IF NOT EXISTS tiquetes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  funcion_id INTEGER REFERENCES funciones(id) ON DELETE CASCADE,
  fila INTEGER NOT NULL,
  columna INTEGER NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'vendido',
  comprador_nombre VARCHAR(255),
  comprador_email VARCHAR(255),
  validado BOOLEAN DEFAULT false,
  validado_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(funcion_id, fila, columna)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_funciones_fecha ON funciones(fecha);
CREATE INDEX IF NOT EXISTS idx_funciones_pelicula ON funciones(pelicula_id);
CREATE INDEX IF NOT EXISTS idx_tiquetes_funcion ON tiquetes(funcion_id);
CREATE INDEX IF NOT EXISTS idx_tiquetes_codigo ON tiquetes(codigo);

-- Insertar salas por defecto
INSERT INTO salas (nombre, filas, columnas, tipo) VALUES
  ('Sala 1', 10, 15, 'standard'),
  ('Sala 2', 10, 15, 'standard'),
  ('Sala 3', 8, 12, 'VIP')
ON CONFLICT DO NOTHING;

-- Insertar películas de ejemplo
INSERT INTO peliculas (titulo, sinopsis, duracion, genero, clasificacion, director, imagen_url) VALUES
  ('Dune: Parte Dos', 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.', 166, 'Ciencia Ficción', 'PG-13', 'Denis Villeneuve', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'),
  ('Oppenheimer', 'La historia del científico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.', 180, 'Drama', 'R', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'),
  ('Spider-Man: Across the Spider-Verse', 'Miles Morales regresa para una épica aventura que transportará al amigable vecino de Brooklyn a través del Multiverso.', 140, 'Animación', 'PG', 'Joaquim Dos Santos', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'),
  ('Wonka', 'Basada en el personaje de Roald Dahl, cuenta la historia de cómo Willy Wonka se convirtió en el famoso chocolatero.', 116, 'Fantasía', 'PG', 'Paul King', 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg'),
  ('Kung Fu Panda 4', 'Po debe entrenar a un nuevo guerrero mientras enfrenta a una villana que puede convocar espíritus de maestros caídos.', 94, 'Animación', 'PG', 'Mike Mitchell', 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg'),
  ('Godzilla x Kong: El Nuevo Imperio', 'Godzilla y Kong deben unirse contra una amenaza colosal escondida en nuestro mundo.', 115, 'Acción', 'PG-13', 'Adam Wingard', 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg')
ON CONFLICT DO NOTHING;

-- Insertar funciones de ejemplo (para los próximos 7 días)
INSERT INTO funciones (pelicula_id, sala_id, fecha, hora, precio, formato, idioma)
SELECT 
  p.id,
  s.id,
  CURRENT_DATE + (d.day_offset || ' days')::INTERVAL,
  t.hora::TIME,
  CASE WHEN s.tipo = 'VIP' THEN 18000 ELSE 12000 END,
  CASE WHEN d.day_offset % 2 = 0 THEN '2D' ELSE '3D' END,
  'Español'
FROM peliculas p
CROSS JOIN salas s
CROSS JOIN (VALUES (0), (1), (2), (3), (4), (5), (6)) AS d(day_offset)
CROSS JOIN (VALUES ('14:00'), ('17:00'), ('20:00'), ('22:30')) AS t(hora)
WHERE p.activa = true AND s.activa = true
ON CONFLICT DO NOTHING;
