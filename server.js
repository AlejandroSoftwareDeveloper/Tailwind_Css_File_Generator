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
