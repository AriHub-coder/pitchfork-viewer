# Pitchfork Selects Viewer

Visor ultra clean de `Pitchfork Selects`, 1 cover por vez.

## Qué hace
- Busca automáticamente la nota más reciente de **Pitchfork Selects**
- Extrae tracks/artistas
- Enriquece con artwork y links desde Apple
- Escribe `data/latest.json`
- GitHub Actions lo actualiza solo cada lunes
- `index.html` muestra un cover por vez

## Cómo publicarlo en GitHub
1. Creá un repo nuevo.
2. Subí estos archivos al branch principal.
3. En GitHub: **Settings → Pages**
4. En **Build and deployment**, elegí:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / root
5. Guardá.

Tu sitio va a quedar en una URL tipo:
`https://TU-USUARIO.github.io/TU-REPO/`

## Cómo forzarlo manualmente
- Entrá a **Actions**
- Abrí **Update Pitchfork Viewer**
- Tocá **Run workflow**

## Qué archivo actualiza GitHub Actions
- `data/latest.json`

## Horario del cron
El workflow está seteado a:

`15 13 * * 1`

Eso significa:
- lunes
- 13:15 UTC

Ajustalo si querés otro horario.

## Estructura
- `index.html` → visor
- `update.js` → script que genera la data
- `.github/workflows/update.yml` → actualización automática
- `data/latest.json` → cache de la última semana
