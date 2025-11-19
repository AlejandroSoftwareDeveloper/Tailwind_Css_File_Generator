import express from 'express';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// 1. Tailwind watch en background
spawn('npx', ['tailwindcss', '-i', './src/css/input.css', '-o', './src/css/output.css', '--watch'], {
  stdio: 'inherit',
  shell: true
});

// 2. Servidor LiveReload
const liveReloadServer = livereload.createServer({
  exts: ['html', 'css', 'js'],
  delay: 100
});

liveReloadServer.watch(path.join(__dirname, 'src'));

// 3. Express
const app = express();

// FIRST: Inyectar script de recarga
app.use(connectLiveReload());

// SECOND: Servir archivos estáticos organizados por tipo
['/css','/js','/images','/assets'].forEach( e=> {
    app.use(e, express.static(path.join(__dirname, `src${e}`)));
});

// THIRD: Rutas para archivos HTML
function createHtmlRoutes(dir, basePath = '') {
  const fullPath = path.join('src/html', dir);
  
  // Verificar si existe el directorio
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directorio no encontrado: ${fullPath}`);
    return;
  }
  
  fs.readdirSync(fullPath).forEach(item => {
    const itemPath = path.join(fullPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      createHtmlRoutes(path.join(dir, item), path.join(basePath, item));
    } else if (item.endsWith('.html')) {
      const routeName = item === 'index.html' ? basePath : path.join(basePath, item.replace('.html', ''));
      const route = routeName || '/';
      
      app.get(`/${route}`, (req, res) => {
        res.sendFile(path.resolve(itemPath));
      });
      console.log(`📄 Ruta: /${route} -> ${itemPath}`);
    }
  });
}

// Iniciar escaneo desde la carpeta html
createHtmlRoutes('');

// Ruta por defecto para archivos HTML en raíz de src/html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'src/html/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Página no encontrada');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT} (recarga automática activa)`);
  console.log('📁 Estructura de carpetas:');
  console.log('   📄 HTML: /src/html/');
  console.log('   🎨 CSS:  /src/css/');
  console.log('   ⚡ JS:   /src/js/');
  console.log('   🖼️  IMG: /src/images/');
});



// import express from 'express';
// import livereload from 'livereload';
// import connectLiveReload from 'connect-livereload';
// import { fileURLToPath } from 'url';
// import { spawn } from 'child_process';
// import fs from 'fs';
// import path from 'path';
//
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const PORT = 3000;
//
// // 1. Tailwind watch en background
// spawn('npx', ['tailwindcss', '-i', './src/css/input.css', '-o', './src/css/output.css', '--watch'], {
//   stdio: 'inherit',
//   shell: true
// });
//
// // 2. Servidor LiveReload
// const liveReloadServer = livereload.createServer({
//   exts: ['html', 'css', 'js'],
//   delay: 100
// });
//
// liveReloadServer.watch(path.join(__dirname, 'src'));
//
// // 3. Express
// const app = express();
//
// // FIRST: Inyectar script de recarga
// app.use(connectLiveReload());
//
// // SECOND: Servir archivos estáticos organizados por tipo
// ['/css','/js','/images','/assets'].forEach( e=> {
//     app.use(e, express.static(path.join(__dirname, `src${e}`)));
// });
//
// // THIRD: Sistema dinámico de rutas HTML
// let htmlRoutes = new Map();
//
// function scanAndRegisterHTMLRoutes() {
//   const newRoutes = new Map();
//
//   function scanDirectory(dir, basePath = '') {
//     const fullPath = path.join('src/html', dir);
//
//     if (!fs.existsSync(fullPath)) {
//       console.log(`⚠️  Directorio no encontrado: ${fullPath}`);
//       return;
//     }
//
//     fs.readdirSync(fullPath).forEach(item => {
//       const itemPath = path.join(fullPath, item);
//       const stat = fs.statSync(itemPath);
//
//       if (stat.isDirectory()) {
//         scanDirectory(path.join(dir, item), path.join(basePath, item));
//       } else if (item.endsWith('.html')) {
//         const routeName = item === 'index.html' ? basePath : path.join(basePath, item.replace('.html', ''));
//         const route = routeName || '/';
//         const normalizedRoute = `/${route}`.replace(/\\/g, '/').replace(/\/+/g, '/');
//
//         newRoutes.set(normalizedRoute, path.resolve(itemPath));
//       }
//     });
//   }
//
//   scanDirectory('');
//   return newRoutes;
// }
//
// function updateRoutes() {
//   const newRoutes = scanAndRegisterHTMLRoutes();
//
//   // Encontrar rutas nuevas
//   const addedRoutes = [];
//   for (const [route] of newRoutes) {
//     if (!htmlRoutes.has(route)) {
//       addedRoutes.push(route);
//     }
//   }
//
//   // Encontrar rutas eliminadas
//   const removedRoutes = [];
//   for (const [route] of htmlRoutes) {
//     if (!newRoutes.has(route)) {
//       removedRoutes.push(route);
//     }
//   }
//
//   // Actualizar el mapa de rutas
//   htmlRoutes = newRoutes;
//
//   // Log de cambios
//   if (addedRoutes.length > 0) {
//     console.log('➕ Nuevas rutas detectadas:', addedRoutes);
//   }
//   if (removedRoutes.length > 0) {
//     console.log('🗑️  Rutas eliminadas:', removedRoutes);
//   }
//
//   return { added: addedRoutes, removed: removedRoutes };
// }
//
// // Registrar todas las rutas iniciales
// function registerRoutes() {
//   htmlRoutes = scanAndRegisterHTMLRoutes();
//
//   // Registrar cada ruta en Express
//   for (const [route, filePath] of htmlRoutes) {
//     app.get(route, (req, res) => {
//       res.sendFile(filePath);
//     });
//   }
//
//   console.log('📄 Rutas HTML registradas:');
//   for (const [route] of htmlRoutes) {
//     console.log(`   ${route}`);
//   }
// }
//
// // Inicializar rutas
// registerRoutes();
//
// // Ruta por defecto para archivos HTML en raíz de src/html
// app.get('/', (req, res) => {
//   const indexPath = path.join(__dirname, 'src/html/index.html');
//   if (fs.existsSync(indexPath)) {
//     res.sendFile(indexPath);
//   } else {
//     res.status(404).send('Página no encontrada');
//   }
// });
//
// // 4. Sistema de monitoreo de archivos para detección automática
// function setupFileWatcher() {
//   const htmlDir = path.join(__dirname, 'src/html');
//
//   if (!fs.existsSync(htmlDir)) {
//     console.log('⚠️  Directorio HTML no encontrado, creando...');
//     fs.mkdirSync(htmlDir, { recursive: true });
//   }
//
//   // Usar el watcher nativo de Node.js
//   const watcher = fs.watch(htmlDir, { recursive: true }, (eventType, filename) => {
//     if (filename && filename.endsWith('.html')) {
//       console.log(`🔄 Cambio detectado en: ${filename}`);
//
//       // Pequeño delay para asegurar que el archivo esté listo
//       setTimeout(() => {
//         const changes = updateRoutes();
//
//         // Re-registrar todas las rutas si hay cambios
//         if (changes.added.length > 0 || changes.removed.length > 0) {
//           // Limpiar rutas antiguas (esto es simplificado)
//           // En una implementación más robusta, podrías usar express.Router()
//           console.log('🔄 Actualizando rutas...');
//
//           // Para una implementación más avanzada, considera reiniciar el router
//           // o usar un sistema de rutas dinámicas más sofisticado
//         }
//       }, 100);
//     }
//   });
//
//   console.log('👁️  Monitoreando cambios en archivos HTML...');
//   return watcher;
// }
//
// // Iniciar el monitoreo
// setupFileWatcher();
//
// // Ruta para forzar actualización manual de rutas
// app.get('/admin/reload-routes', (req, res) => {
//   const changes = updateRoutes();
//   res.json({
//     message: 'Rutas actualizadas',
//     changes: changes,
//     totalRoutes: Array.from(htmlRoutes.keys())
//   });
// });
//
// // Manejo de rutas no encontradas
// app.use((req, res) => {
//   const requestedPath = req.path;
//   res.status(404).send(`
//     <html>
//       <head><title>Página no encontrada</title></head>
//       <body>
//         <h1>404 - Página no encontrada</h1>
//         <p>La ruta <strong>${requestedPath}</strong> no existe.</p>
//         <p>Rutas disponibles:</p>
//         <ul>
//           ${Array.from(htmlRoutes.keys()).map(route => `<li><a href="${route}">${route}</a></li>`).join('')}
//         </ul>
//       </body>
//     </html>
//   `);
// });
//
// app.listen(PORT, () => {
//   console.log(`🚀 http://localhost:${PORT} (recarga automática activa)`);
//   console.log('📁 Estructura de carpetas:');
//   console.log('   📄 HTML: /src/html/');
//   console.log('   🎨 CSS:  /src/css/');
//   console.log('   ⚡ JS:   /src/js/');
//   console.log('   🖼️  IMG: /src/images/');
//   console.log('\n🔧 Características:');
//   console.log('   ✅ Recarga automática con LiveReload');
//   console.log('   ✅ Detección automática de nuevos HTML');
//   console.log('   ✅ Monitoreo en tiempo real de cambios');
//   console.log('   ✅ Ruta de administración: /admin/reload-routes');
// });



