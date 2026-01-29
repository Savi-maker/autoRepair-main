import { Customer, Vehicle, Order, Visit } from '../navigation/types'; 

export const customers: Customer[] = [
  { id: 'c1', name: 'Jan Kowalski', phone: '+48 600 000 111', email: 'jan@example.com' },
  { id: 'c2', name: 'Anna Nowak', phone: '+48 600 000 222', email: 'anna@example.com' },
];

export const vehicles: Vehicle[] = [
  { id: 'v1', make: 'Toyota', model: 'Corolla', year: 2016, plate: 'PO 12345', ownerId: 'c1', lastServiceAt: '2025-11-01T09:30:00' },
  { id: 'v2', make: 'VW', model: 'Golf', year: 2018, plate: 'WW 45678', ownerId: 'c2', lastServiceAt: '2025-10-22T13:15:00' },
  { id: 'v3', make: 'Ford', model: 'Focus', year: 2015, plate: 'KR 98765' },
];

export const orders: Order[] = [
  { id: 'o1', vehicleId: 'v1', customerId: 'c1', service: 'Przegląd + wymiana oleju', mechanic: 'Jan Kowalski', startDate: '2025-11-20T10:30:00', status: 'oczekujące', cost: 350 },
  { id: 'o2', vehicleId: 'v2', customerId: 'c2', service: 'Wymiana klocków + tarcz', mechanic: 'Piotr Nowak', startDate: '2025-11-18T08:00:00', status: 'w trakcie' },
  { id: 'o3', vehicleId: 'v1', customerId: 'c1', service: 'Diagnostyka zawieszenia', mechanic: 'Ewa Zielińska', startDate: '2025-10-02T14:00:00', status: 'zakończone', cost: 220 },
  { id: 'o4', vehicleId: 'v3', service: 'Wymiana akumulatora', mechanic: 'Marek Lewandowski', startDate: '2025-11-21T12:00:00', status: 'oczekujące' },
];

export const visits: Visit[] = [
  { id: 'vis1', date: '2025-11-20T10:30:00', title: 'Przegląd + olej', vehicleId: 'v1', customerId: 'c1', status: 'oczekujące' },
  { id: 'vis2', date: '2025-11-18T08:00:00', title: 'Klocki + tarcze', vehicleId: 'v2', customerId: 'c2', status: 'w trakcie' },
  { id: 'vis3', date: '2025-11-21T12:00:00', title: 'Akumulator', vehicleId: 'v3', status: 'oczekujące' },
];

