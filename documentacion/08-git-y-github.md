# Git: convenciones y flujo de trabajo

## Nomenclatura de ramas

Formato: `tipo/descripcion-en-kebab-case` (sin paréntesis, sin `+`, sin espacios — esos caracteres dan problemas en Git y en PowerShell/CMD).

Los mismos `tipo` que en los commits: `feat/`, `fix/`, `docs/`, `data/`, `refactor/`, `chore/`.

Ejemplos:
```
feat/initial-setup-vite-react-tailwind-zustand
feat/combat-engine
feat/map-generator
fix/tailwind-import
docs/estructura-carpetas
```

Flujo para arrancar trabajo nuevo:
```cmd
git checkout main
git pull
git checkout -b feat/nombre-descriptivo
```

## Nomenclatura de commits (Conventional Commits + convención propia)

```
tipo(alcance): descripción breve en presente
```

Tipos usados en este proyecto:
- `feat` — nueva funcionalidad
- `fix` — corrección de bug
- `data` — cambios solo en JSON de contenido (`src/data/`)
- `docs` — cambios en `documentacion/`
- `style` — cambios de formato/CSS sin lógica
- `refactor` — reestructuración sin cambiar comportamiento
- `chore` — mantenimiento (dependencias, configuración)

Ejemplos:
```
feat(engine): implementa calcularDano y resolverTurnoCombate
data(characters): ajusta stats base de Rock Lee
docs: añade documentación de estructura de carpetas
chore(deps): instala tailwindcss v4 y @tailwindcss/vite
```

Regla: un commit = un cambio lógico coherente. Evitar commits que mezclen JSON, lógica y CSS a la vez.

## Repositorio remoto

Repo en GitHub: `github.com/<usuario>/naruto-roguelike` (pendiente de rellenar `<usuario>` una vez creado).

### Conexión inicial (una sola vez)

```cmd
git remote add origin https://github.com/<usuario>/naruto-roguelike.git
git branch -M main
git push -u origin main
```

### Flujo habitual

```cmd
git add .
git commit -m "tipo(alcance): descripción"
git push
```

### Importante

Verificar que existe `.gitignore` con `node_modules/` incluido antes del primer `git add .` (Vite lo genera automáticamente al crear el proyecto).
