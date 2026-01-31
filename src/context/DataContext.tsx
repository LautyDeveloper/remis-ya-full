import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Chofer, Pasajero, Telefonista, Viaje, Reserva } from '@/types';
import { sheetsApi } from '@/services/sheetsApi';

import choferesData from '@/data/choferes.json';
import pasajerosData from '@/data/pasajeros.json';
import telefonistasData from '@/data/telefonistas.json';
import viajesData from '@/data/viajes.json';
import reservasData from '@/data/reservas.json';

interface DataContextType {
  choferes: Chofer[];
  pasajeros: Pasajero[];
  telefonistas: Telefonista[];
  viajes: Viaje[];
  reservas: Reserva[];
  isLoading: boolean;
  error: Error | null;

  // Chofer actions
  addChofer: (chofer: Omit<Chofer, 'id' | 'posicionCola'>) => Promise<void>;
  updateChofer: (id: number, chofer: Partial<Chofer>) => Promise<void>;
  deleteChofer: (id: number) => Promise<void>;

  // Pasajero actions
  addPasajero: (pasajero: Omit<Pasajero, 'id'>) => Promise<void>;
  updatePasajero: (id: number, pasajero: Partial<Pasajero>) => Promise<void>;
  deletePasajero: (id: number) => Promise<void>;

  // Telefonista actions
  addTelefonista: (telefonista: Omit<Telefonista, 'id'>) => Promise<void>;
  updateTelefonista: (id: number, telefonista: Partial<Telefonista>) => Promise<void>;
  deleteTelefonista: (id: number) => Promise<void>;

  // Viaje actions
  addViaje: (viaje: Omit<Viaje, 'id'>) => Promise<void>;
  updateViaje: (id: number, viaje: Partial<Viaje>) => Promise<void>;
  deleteViaje: (id: number) => Promise<void>;
  completarViaje: (id: number) => Promise<void>;
  cancelarViaje: (id: number) => Promise<void>;

  // Reserva actions
  addReserva: (reserva: Omit<Reserva, 'id'>) => Promise<void>;
  updateReserva: (id: number, reserva: Partial<Reserva>) => Promise<void>;
  deleteReserva: (id: number) => Promise<void>;
  convertirReservaAViaje: (reservaId: number, telefonistaId: number) => Promise<void>;

  // Queue management
  getNextChoferInQueue: () => Chofer | null;
  moveChoferToEndOfQueue: (choferId: number) => Promise<void>;

  // Reset data
  resetData: () => void;

  // Active telefonista
  activeTelefonista: Telefonista | null;
  setActiveTelefonista: (telefonista: Telefonista | null) => void;

  // Pagination
  loadMoreViajes: () => Promise<void>;
  hasMoreViajes: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ✅ HELPER: Parsear JSON seguro
function safeJsonParse(value: any, fallback: any = []): any {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;

  if (typeof value === 'string') {
    if (value.trim() === '') return fallback;

    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch (error) {
      return [value];
    }
  }

  return fallback;
}

// ✅ HELPER: Convertir a número seguro
function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [pasajeros, setPasajeros] = useState<Pasajero[]>([]);
  const [telefonistas, setTelefonistas] = useState<Telefonista[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [activeTelefonista, setActiveTelefonista] = useState<Telefonista | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Pagination state for Viajes
  const [hasMoreViajes, setHasMoreViajes] = useState(true);
  const VIAJES_PER_PAGE = 20;

  const fetchViajesData = async (append = false) => {
    try {
      setIsLoading(true);
      const viajesData = await sheetsApi.getAll('Viajes', {
        limit: VIAJES_PER_PAGE,
        offset: append ? viajes.length : 0,
        orderBy: 'fechaHora',
        order: 'desc'
      });

      // ✅ Procesar Viajes con validación de ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedViajes = viajesData
        .map((v: any) => ({
          ...v,
          id: safeNumber(v.id),
          pasajeroId: v.pasajeroId ? safeNumber(v.pasajeroId) : null,
          choferId: safeNumber(v.choferId),
          telefonistaId: safeNumber(v.telefonistaId),
          monto: safeNumber(v.monto, 0),
        }))
        .filter((v: Viaje) => v.id > 0);

      if (append) {
        setViajes(prev => [...prev, ...processedViajes]);
      } else {
        setViajes(processedViajes);
      }

      setHasMoreViajes(processedViajes.length === VIAJES_PER_PAGE);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching viajes:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreViajes = async () => {
    await fetchViajesData(true);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [choferesData, pasajerosData, telefonistasData, reservasData] = await Promise.all([
        sheetsApi.getAll('Choferes'),
        sheetsApi.getAll('Pasajeros'),
        sheetsApi.getAll('Telefonistas'),
        sheetsApi.getAll('Reservas'),
      ]);

      await fetchViajesData(false);

      // 🔍 DEBUG: Ver qué llega desde Sheets
      console.log('🔍 RAW Choferes Data:', choferesData);
      console.log('🔍 RAW Pasajeros Data:', pasajerosData);
      console.log('🔍 RAW Telefonistas Data:', telefonistasData);


      // ✅ Procesar Choferes con validación de ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedChoferes = choferesData
        .map((c: any) => {
          const processed = {
            ...c,
            id: safeNumber(c.id),
            posicionCola: safeNumber(c.posicionCola, 0),
          };
          console.log('🔍 Processed Chofer:', processed, 'Valid?', processed.id > 0);
          return processed;
        })
        .filter((c: Chofer) => c.id > 0);

      console.log('✅ Final Choferes:', processedChoferes);
      setChoferes(processedChoferes);

      // ✅ Procesar Pasajeros con validación de ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPasajeros(pasajerosData
        .map((p: any) => ({
          ...p,
          id: safeNumber(p.id),
          direccionesFavoritas: safeJsonParse(p.direccionesFavoritas, []),
        }))
        .filter((p: Pasajero) => p.id > 0)
      );

      // ✅ Procesar Telefonistas con validación de ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTelefonistas(telefonistasData
        .map((t: any) => ({
          ...t,
          id: safeNumber(t.id),
        }))
        .filter((t: Telefonista) => t.id > 0)
      );

      // ✅ Procesar Reservas con validación de ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReservas(reservasData
        .map((r: any) => ({
          ...r,
          id: safeNumber(r.id),
          pasajeroId: r.pasajeroId ? safeNumber(r.pasajeroId) : null,
          choferId: r.choferId ? safeNumber(r.choferId) : null,
          montoEstimado: safeNumber(r.montoEstimado, 0),
        }))
        .filter((r: Reserva) => r.id > 0)
      );

      setError(null);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Chofer CRUD
  const addChofer = async (choferData: Omit<Chofer, 'id' | 'posicionCola'>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.add('Choferes', choferData);
      console.log('🔍 Add Chofer Response:', updatedData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setChoferes(updatedData
        .map((c: any) => ({
          ...c,
          id: safeNumber(c.id),
          posicionCola: safeNumber(c.posicionCola, 0),
        }))
        .filter((c: Chofer) => c.id > 0)
      );
    } catch (error) {
      console.error('Error adding chofer:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChofer = async (id: number, choferData: Partial<Chofer>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.update('Choferes', id, choferData);
      console.log('🔍 Update Chofer Response:', updatedData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setChoferes(updatedData
        .map((c: any) => ({
          ...c,
          id: safeNumber(c.id),
          posicionCola: safeNumber(c.posicionCola, 0),
        }))
        .filter((c: Chofer) => c.id > 0)
      );
    } catch (error) {
      console.error('Error updating chofer:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChofer = async (id: number) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.delete('Choferes', id);
      console.log('🔍 Delete Chofer Response:', updatedData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setChoferes(updatedData
        .map((c: any) => ({
          ...c,
          id: safeNumber(c.id),
          posicionCola: safeNumber(c.posicionCola, 0),
        }))
        .filter((c: Chofer) => c.id > 0)
      );
    } catch (error) {
      console.error('Error deleting chofer:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pasajero CRUD
  const addPasajero = async (pasajeroData: Omit<Pasajero, 'id'>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.add('Pasajeros', pasajeroData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPasajeros(updatedData
        .map((p: any) => ({
          ...p,
          id: safeNumber(p.id),
          direccionesFavoritas: safeJsonParse(p.direccionesFavoritas, []),
        }))
        .filter((p: Pasajero) => p.id > 0)
      );
    } catch (error) {
      console.error('Error adding pasajero:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePasajero = async (id: number, pasajeroData: Partial<Pasajero>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.update('Pasajeros', id, pasajeroData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPasajeros(updatedData
        .map((p: any) => ({
          ...p,
          id: safeNumber(p.id),
          direccionesFavoritas: safeJsonParse(p.direccionesFavoritas, []),
        }))
        .filter((p: Pasajero) => p.id > 0)
      );
    } catch (error) {
      console.error('Error updating pasajero:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePasajero = async (id: number) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.delete('Pasajeros', id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPasajeros(updatedData
        .map((p: any) => ({
          ...p,
          id: safeNumber(p.id),
          direccionesFavoritas: safeJsonParse(p.direccionesFavoritas, []),
        }))
        .filter((p: Pasajero) => p.id > 0)
      );
    } catch (error) {
      console.error('Error deleting pasajero:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Telefonista CRUD
  const addTelefonista = async (telefonistaData: Omit<Telefonista, 'id'>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.add('Telefonistas', telefonistaData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTelefonistas(updatedData
        .map((t: any) => ({
          ...t,
          id: safeNumber(t.id),
        }))
        .filter((t: Telefonista) => t.id > 0)
      );
    } catch (error) {
      console.error('Error adding telefonista:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTelefonista = async (id: number, telefonistaData: Partial<Telefonista>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.update('Telefonistas', id, telefonistaData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTelefonistas(updatedData
        .map((t: any) => ({
          ...t,
          id: safeNumber(t.id),
        }))
        .filter((t: Telefonista) => t.id > 0)
      );
    } catch (error) {
      console.error('Error updating telefonista:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTelefonista = async (id: number) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.delete('Telefonistas', id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTelefonistas(updatedData
        .map((t: any) => ({
          ...t,
          id: safeNumber(t.id),
        }))
        .filter((t: Telefonista) => t.id > 0)
      );
    } catch (error) {
      console.error('Error deleting telefonista:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Viaje CRUD
  const addViaje = async (viajeData: Omit<Viaje, 'id'>) => {
    setIsLoading(true);
    try {
      await sheetsApi.add('Viajes', viajeData);
      await fetchViajesData(false);

      // Update chofer status to en_viaje
      if (viajeData.estado === 'en_curso') {
        await updateChofer(viajeData.choferId, { estado: 'en_viaje' });
      }
    } catch (error) {
      console.error('Error adding viaje:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateViaje = async (id: number, viajeData: Partial<Viaje>) => {
    setIsLoading(true);
    try {
      await sheetsApi.update('Viajes', id, viajeData);
      await fetchViajesData(false);
    } catch (error) {
      console.error('Error updating viaje:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteViaje = async (id: number) => {
    setIsLoading(true);
    try {
      await sheetsApi.delete('Viajes', id);
      await fetchViajesData(false);
    } catch (error) {
      console.error('Error deleting viaje:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const completarViaje = async (id: number) => {
    const viaje = viajes.find(v => v.id === id);
    if (viaje) {
      await updateViaje(id, { estado: 'completado' });
      await updateChofer(viaje.choferId, { estado: 'disponible' });
      await moveChoferToEndOfQueue(viaje.choferId);
    }
  };

  const cancelarViaje = async (id: number) => {
    const viaje = viajes.find(v => v.id === id);
    if (viaje && viaje.estado === 'en_curso') {
      await updateChofer(viaje.choferId, { estado: 'disponible' });
    }
    await updateViaje(id, { estado: 'cancelado' });
  };

  // Reserva CRUD
  const addReserva = async (reservaData: Omit<Reserva, 'id'>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.add('Reservas', reservaData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReservas(updatedData
        .map((r: any) => ({
          ...r,
          id: safeNumber(r.id),
          pasajeroId: r.pasajeroId ? safeNumber(r.pasajeroId) : null,
          choferId: r.choferId ? safeNumber(r.choferId) : null,
          montoEstimado: safeNumber(r.montoEstimado, 0),
        }))
        .filter((r: Reserva) => r.id > 0)
      );
    } catch (error) {
      console.error('Error adding reserva:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReserva = async (id: number, reservaData: Partial<Reserva>) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.update('Reservas', id, reservaData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReservas(updatedData
        .map((r: any) => ({
          ...r,
          id: safeNumber(r.id),
          pasajeroId: r.pasajeroId ? safeNumber(r.pasajeroId) : null,
          choferId: r.choferId ? safeNumber(r.choferId) : null,
          montoEstimado: safeNumber(r.montoEstimado, 0),
        }))
        .filter((r: Reserva) => r.id > 0)
      );
    } catch (error) {
      console.error('Error updating reserva:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReserva = async (id: number) => {
    setIsLoading(true);
    try {
      const updatedData = await sheetsApi.delete('Reservas', id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReservas(updatedData
        .map((r: any) => ({
          ...r,
          id: safeNumber(r.id),
          pasajeroId: r.pasajeroId ? safeNumber(r.pasajeroId) : null,
          choferId: r.choferId ? safeNumber(r.choferId) : null,
          montoEstimado: safeNumber(r.montoEstimado, 0),
        }))
        .filter((r: Reserva) => r.id > 0)
      );
    } catch (error) {
      console.error('Error deleting reserva:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertirReservaAViaje = async (reservaId: number, telefonistaId: number) => {
    const reserva = reservas.find(r => r.id === reservaId);
    const telefonista = telefonistas.find(t => t.id === telefonistaId);

    if (reserva && telefonista) {
      const chofer = reserva.choferId
        ? choferes.find(c => c.id === reserva.choferId)
        : getNextChoferInQueue();

      if (chofer) {
        await addViaje({
          origen: reserva.origen,
          destino: reserva.destino,
          pasajeroId: reserva.pasajeroId,
          pasajeroNombre: reserva.pasajeroNombre,
          choferId: chofer.id,
          choferNombre: chofer.nombre,
          telefonistaId: telefonista.id,
          telefonistaNombre: telefonista.nombre,
          monto: reserva.montoEstimado,
          metodoPago: reserva.metodoPago,
          estado: 'en_curso',
          fechaHora: new Date().toISOString(),
          notas: reserva.notas,
        });

        await updateReserva(reservaId, { estado: 'completada' });
      }
    }
  };

  // Queue management
  const getNextChoferInQueue = (): Chofer | null => {
    const disponibles = choferes
      .filter(c => c.estado === 'disponible')
      .sort((a, b) => a.posicionCola - b.posicionCola);
    return disponibles[0] || null;
  };

  const moveChoferToEndOfQueue = async (choferId: number) => {
    setIsLoading(true);
    const originalChoferes = [...choferes];

    const choferToMove = choferes.find(c => c.id === choferId);
    if (!choferToMove) return;

    const maxPos = Math.max(0, ...choferes.map(c => c.posicionCola));

    const updatedChoferes = choferes
      .map(c => {
        if (c.id === choferId) {
          return { ...c, posicionCola: maxPos + 1 };
        }
        return c;
      })
      .sort((a, b) => a.posicionCola - b.posicionCola)
      .map((c, index) => ({ ...c, posicionCola: index + 1 }));

    setChoferes(updatedChoferes);

    try {
      const updatePromises = updatedChoferes.map(c =>
        sheetsApi.update('Choferes', c.id, { posicionCola: c.posicionCola })
      );
      const results = await Promise.all(updatePromises);
      if (results.length > 0) {
        const finalData = results[results.length - 1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setChoferes(finalData
          .map((c: any) => ({
            ...c,
            id: safeNumber(c.id),
            posicionCola: safeNumber(c.posicionCola, 0),
          }))
          .filter((c: Chofer) => c.id > 0)
        );
      }
    } catch (error) {
      console.error('Error moving chofer in queue:', error);
      setError(error as Error);
      setChoferes(originalChoferes);
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
    setChoferes(choferesData as Chofer[]);
    setPasajeros(pasajerosData as Pasajero[]);
    setTelefonistas(telefonistasData as Telefonista[]);
    setViajes(viajesData as Viaje[]);
    setReservas(reservasData as Reserva[]);
    setActiveTelefonista(null);
  };

  return (
    <DataContext.Provider value={{
      choferes,
      pasajeros,
      telefonistas,
      viajes,
      reservas,
      isLoading,
      error,
      addChofer,
      updateChofer,
      deleteChofer,
      addPasajero,
      updatePasajero,
      deletePasajero,
      addTelefonista,
      updateTelefonista,
      deleteTelefonista,
      addViaje,
      updateViaje,
      deleteViaje,
      completarViaje,
      cancelarViaje,
      addReserva,
      updateReserva,
      deleteReserva,
      convertirReservaAViaje,
      getNextChoferInQueue,
      moveChoferToEndOfQueue,
      resetData,
      activeTelefonista,
      setActiveTelefonista,
      loadMoreViajes,
      hasMoreViajes,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
