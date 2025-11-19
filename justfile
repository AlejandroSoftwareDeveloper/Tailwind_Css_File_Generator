set windows-shell := ["CMD","/C"]

# Lista de comandos
cmd:
    @just --list

# Inicia el servicio
watch:
    @npm run dev

# Instalar las dependencias
install:
    @npm install
