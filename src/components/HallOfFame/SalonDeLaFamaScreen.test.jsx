// @vitest-environment jsdom
//
// El Salón de la Fama solo tiene que hacer bien dos cosas: decir qué hacer cuando está
// vacío (lo normal hasta la primera victoria) y enseñar a cada equipo ganador con sus
// medallas. Y un invariante de datos: **toda medalla que el juego puede dar tiene que
// estar dibujada**, o el arco nuevo daría un hueco en la fila sin que nada falle.

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '../../test-dom';
import SalonDeLaFamaScreen from './SalonDeLaFamaScreen';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import campaignsData from '../../data/campaigns.json';

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({ salonDeLaFama: [] });
});

describe('SalonDeLaFamaScreen', () => {
  it('vacío, dice cómo se llena en vez de quedarse en blanco', () => {
    render(<SalonDeLaFamaScreen />);
    expect(screen.getByText(/No run has been won yet/i)).toBeInTheDocument();
  });

  it('enseña cada equipo ganador con sus nombres y niveles', () => {
    useAchievementsStore.setState({
      salonDeLaFama: [{
        fecha: '2026-10-13',
        campanaId: 'camino_ninja',
        equipo: [{ id: 'naruto', nivel: 50 }, { id: 'rock_lee', nivel: 48 }],
        medallas: ['pais_de_las_olas', 'examen_chunin', 'invasion_de_pain'],
      }],
    });
    render(<SalonDeLaFamaScreen />);
    expect(screen.getByText('Naruto U.')).toBeInTheDocument();
    expect(screen.getByText('Rock Lee')).toBeInTheDocument();
    expect(screen.getByText('Lv.50')).toBeInTheDocument();
    // Las tres medallas ganadas, con su nombre como texto alternativo.
    expect(screen.getByAltText('Wave Crest')).toBeInTheDocument();
    expect(screen.getByAltText('Cloud Crest')).toBeInTheDocument();
  });
});

describe('invariante: toda medalla está dibujada', () => {
  it('cada arco de cada campaña declara su medalla y tiene su PNG', () => {
    const raiz = path.resolve(__dirname, '../../');
    const arcos = fs.readdirSync(path.join(raiz, 'data/arcs'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(raiz, 'data/arcs', f), 'utf8')));
    const enCampana = new Set(campaignsData.campanas.flatMap((c) => c.arcoIds));
    arcos.filter((a) => enCampana.has(a.id)).forEach((arco) => {
      expect(arco.medalla?.nombre, `${arco.id} sin medalla`).toBeTruthy();
      expect(fs.existsSync(path.join(raiz, 'assets/medals', `${arco.id}.png`)), `${arco.id}.png`).toBe(true);
    });
  });
});
