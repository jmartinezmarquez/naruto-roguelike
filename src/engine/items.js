// src/engine/items.js
// Cálculo puro de la bonificación de stats que da un objeto equipable — sin
// store ni React. Un objeto "equipable" beneficia solo a quien lo lleve
// puesto (un hueco por personaje, ver useGameStore.equiparObjeto), no a todo
// el equipo — por eso esto calcula la bonificación de UN objeto, no de todo
// el inventario.

const BONIFICACION_VACIA = { ataque: 0, defensa: 0, velocidad: 0, hp: 0 };

/**
 * Bonificación de stats que da `item.efecto` si es de tipo `buffEquipable` o
 * `buffYDebuffEquipable`. Para cualquier otro tipo de efecto (`curarPersonaje`,
 * `revivirUnaVez`, `curacionPostCombate`) devuelve la bonificación vacía —
 * esos no son bonificaciones de stats, se resuelven en el store en el
 * momento del evento que los dispara (derrota, victoria, uso manual).
 */
export function calcularBonificacionDeEfecto(efecto) {
  const total = { ...BONIFICACION_VACIA };
  if (!efecto) return total;

  if (efecto.tipo === 'buffEquipable') {
    if (efecto.stat === 'todas') {
      total.ataque += efecto.cantidad;
      total.defensa += efecto.cantidad;
      total.velocidad += efecto.cantidad;
      total.hp += efecto.cantidad;
    } else if (efecto.stat in total) {
      total[efecto.stat] += efecto.cantidad;
    }
  } else if (efecto.tipo === 'buffYDebuffEquipable') {
    if (efecto.buff.stat in total) total[efecto.buff.stat] += efecto.buff.cantidad;
    if (efecto.debuff.stat in total) total[efecto.debuff.stat] += efecto.debuff.cantidad;
  }

  return total;
}

/**
 * Bonificación de stats del objeto equipado por un personaje (o vacía si no
 * lleva nada equipado, o el id no se encuentra en el catálogo).
 */
export function calcularBonificacionDeObjetoEquipado(objetoEquipadoId, objetosDisponibles) {
  if (!objetoEquipadoId) return { ...BONIFICACION_VACIA };
  const item = objetosDisponibles.find((o) => o.id === objetoEquipadoId);
  return calcularBonificacionDeEfecto(item?.efecto);
}
