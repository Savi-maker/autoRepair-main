export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
  UserProfile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  List: undefined;
  AddOrder: undefined;
  Detail: undefined;
  Search: undefined;
  Notifications: undefined;
  Form: undefined;
  Payment: undefined;
  Success: undefined;
  OrderHistory: undefined;
  HelpSupport: undefined;
  TransactionDetails: { transactionId: string };
  AdminPanel: undefined;
  Main: undefined;
  ItemDetails: { orderId: number };
  CurrentLocation: undefined;
  AssignedOrders: undefined;
  Raport: { orderId: number };
  AddRaport: { orderId: number; guardId: number };
  UserRaports: undefined;
};

export type OrderStatus = 'oczekujące' | 'w trakcie' | 'zakończone' | 'anulowane';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  ownerId?: string;
  lastServiceAt?: string; 
}

export interface Order {
  id: string;
  vehicleId: string;
  customerId?: string;
  service: string;
  mechanic: string;
  startDate: string; 
  status: OrderStatus;
  cost?: number;
}

export interface Visit {
  id: string;
  date: string; 
  title: string;
  vehicleId?: string;
  customerId?: string;
  status?: OrderStatus;
}


