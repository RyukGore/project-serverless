# Dashboard de historial de canciones con arquitectura serverless

Aplicación para consultar registros de escucha de Spotify. El proyecto separa la interfaz web de la lógica de acceso a datos: una API serverless desplegada en Vercel consulta Cloud Firestore de Firebase y el frontend Angular consume esa API.

## Arquitectura

```text
Navegador
	|
	v
Frontend Angular (front/)
	| HTTPS
	v
API serverless de Vercel (api/obtenerCanciones.ts)
	| Firebase Admin SDK
	v
Cloud Firestore (colección: spotify_history)
```

La función se ejecuta bajo demanda en Vercel, sin mantener un servidor de aplicaciones propio. La integración con Firebase se realiza en el backend mediante Firebase Admin SDK; las credenciales administrativas no deben incluirse en el código del navegador.

## Componentes

- **API (`api/`)**: función serverless que conecta con Firestore y expone consultas de canciones.
- **Frontend (`front/`)**: aplicación Angular que muestra los registros, permite filtrar por plataforma y cantidad, presenta la distribución por plataforma y permite consultar el detalle de una canción.
- **Base de datos**: colección `spotify_history` en Cloud Firestore.
- **Dataset (`dataset spotify/`)**: archivos del dataset de historial de Spotify, incluido el CSV `spotify_history.csv` y un diccionario de datos. Estos archivos son la fuente de los registros cargados en Firestore; el repositorio no especifica la URL ni la licencia del sitio de descarga.

## API

La aplicación Angular está configurada para consumir la API desplegada en:

```text
https://proyecto-serverless-gamma.vercel.app/api/obtenerCanciones
```

### Listar canciones

```http
GET /api/obtenerCanciones
```

Parámetros opcionales:

- `limit`: cantidad máxima de resultados. El valor predeterminado es `20`.
- `platform`: filtra por coincidencia exacta del campo `platform`, por ejemplo `windows`, `android` o `web player`.

Ejemplo:

```http
GET /api/obtenerCanciones?limit=50&platform=windows
```

La respuesta incluye los registros obtenidos, el total exacto de documentos en la colección y los parámetros aplicados.

### Buscar por ID

```http
GET /api/obtenerCanciones?id=ID_DEL_DOCUMENTO
```

Devuelve el documento solicitado o una respuesta `404` si no existe.

## Requisitos

- Node.js y npm.
- Un proyecto de Google Firebase con Cloud Firestore habilitado.
- Una cuenta de servicio de Firebase con permisos para leer la base de datos.
- Una cuenta de Vercel para desplegar la función API.

## Configuración y ejecución local

### API

1. Instala las dependencias desde la raíz:

   ```bash
   npm install
   ```

2. Configura las credenciales de Firebase Admin para el entorno local. La implementación actual busca el archivo `canciones-serverless-firebase-admin.json` en la raíz del proyecto. Usa una clave privada de una cuenta de servicio con acceso a Firestore.

3. No publiques ni compartas ese archivo. Manténlo fuera del control de versiones y no lo incluyas en el frontend. Para producción, entrega las credenciales mediante un mecanismo seguro de secretos de Vercel; no guardes claves privadas en el repositorio.

4. Despliega el proyecto en Vercel con la raíz del repositorio como directorio del proyecto. La ruta de la función corresponde a `api/obtenerCanciones.ts`.

> La función lee actualmente la cuenta de servicio desde un archivo JSON en la raíz. Asegúrate de adaptar la carga de credenciales a un secreto de entorno antes de desplegar si el archivo privado no está disponible en el entorno de ejecución de Vercel.

### Frontend

```bash
cd front
npm install
npm start
```

Abre `http://localhost:4200`. El frontend usa la URL de Vercel indicada arriba, por lo que requiere que la API esté desplegada y accesible.

Para generar una compilación de producción:

```bash
cd front
npm run build
```

## Datos

El directorio `dataset spotify/` contiene el historial descargado y su diccionario de datos. Los registros utilizados por la aplicación deben estar cargados en la colección `spotify_history` de Cloud Firestore. La API espera que cada documento tenga un ID de Firestore y puede devolver campos como `artist_name`, `track_name`, `platform` y `ms_played`, presentes en la interfaz.

El repositorio no identifica la página de descarga ni las condiciones de uso del dataset. Antes de redistribuir los datos o publicar una instancia con ellos, consulta la fuente original y su licencia.
