# Nodo de reclutar (`components/Recruit/RecruitScreen.jsx`)

Nodo dedicado al reclutamiento, separado de la tienda desde la sesión de rediseño del roadmap punto 1.
Cubre la necesidad central de la run: empiezas con 1 solo personaje y reclutar es obligatorio para
sobrevivir los arcos siguientes.

## Aparición en el mapa

- Sin restricciones de piso ni cap por piso — puede aparecer en cualquier piso incluido el 1.
- Icono `✚` en verde (`text-fuuton`), distinto del `?` de evento y del `¥` de tienda.
- Pesos en `poolTiposNodo`: 22 (País de las Olas), 16 (Examen Chunin), 12 (Invasión de Pain) —
  más frecuente al inicio porque la necesidad de equipo es mayor.

## Qué ofrece

Al entrar al nodo, se generan **hasta 3 personajes candidatos** (pool del arco + logros + iniciales
no elegidos), filtrados para excluir a quienes ya están en el equipo. El jugador elige uno —
**sin coste de oro** — o salta con "SALTAR (HUIR)".

Generado por `generarOfertaReclutar(equipoActual, arcoActualDatos, nivelReclutamiento)`:
- `reclutarActual` = `{ personajes: [{ personajeId, nombre, rareza }, ...], nivelReclutamiento }`.
- El nivel de entrada es `Math.max(1, ...equipo.map(p => p.nivel))` — igual que el criterio de la
  tienda antigua, para que el recluta no entre muy por debajo del resto.

## Interacción

- Un solo clic en la carta recluta al ninja directamente.
- Si el equipo ya está lleno (`tamanoMaximo`), se muestra un panel `PanelReemplazo` modal pidiendo
  a quién expulsar antes de confirmar. Cancelar vuelve a las 3 cartas sin coste.
- Al reemplazar, se aplica `bonusNivelAlReemplazar` sobre el nivel base — reemplazar sigue siendo
  mejor que rellenar un hueco vacío.

## Pool de candidatos

Igual que el pool antiguo de la tienda:
1. `arcoActualDatos.personajesReclutablesIds` (vacío en País de las Olas — sin roster propio).
2. Personajes desbloqueados por logro (`desbloquearPersonajeReclutable`).
3. Los `rareza: 'inicial'` no elegidos al empezar la run (Naruto/Sasuke/Sakura menos el elegido) —
   garantiza siempre al menos 2 candidatos en la primerísima run, incluso sin logros desbloqueados.

## Acción del store

- `elegirReclutaDeNodo(personajeId, idAReemplazar = null)` — llama internamente a
  `reclutarPersonaje`. No cobra oro.
