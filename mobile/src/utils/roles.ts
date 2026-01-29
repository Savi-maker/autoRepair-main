export type UserRole =
  | 'admin'
  | 'kierownik'
  | 'mechanik'
  | 'recepcja'
  | 'user'
  | 'manager'
  | 'mechanic'
  | 'receptionist';

export interface RolePermissions {
  canViewAdminPanel: boolean;
  canManageUsers: boolean;
  canManageCustomers: boolean;
  canViewCustomers: boolean;
  canManageVehicles: boolean;
  canViewVehicles: boolean;
  canCreateOrders: boolean;
  canManageOrders: boolean;
  canViewOrders: boolean;
  canManageAppointments: boolean;
  canViewAppointments: boolean;
  canManageInvoices: boolean;
  canViewInvoices: boolean;
  canManageWarehouse: boolean;
  canViewWarehouse: boolean;
  canManageMessages: boolean;
  canViewMessages: boolean;
  canViewAiHelper: boolean;
  // Nowe uprawnienia dla 8 features
  canViewAnalytics: boolean;
  canManageServicePrices: boolean;
  canViewServicePrices: boolean;
  canViewVehicleHistory: boolean;
  canManageSchedule: boolean;
  canViewSchedule: boolean;
  canManageSuppliers: boolean;
  canViewSuppliers: boolean;
  canViewRatings: boolean;
  canManageEmailTemplates: boolean;
}

const rolePermissions: Record<'admin' | 'kierownik' | 'mechanik' | 'recepcja' | 'user', RolePermissions> = {
  admin: {
    canViewAdminPanel: true,
    canManageUsers: true,
    canManageCustomers: true,
    canViewCustomers: true,
    canManageVehicles: true,
    canViewVehicles: true,
    canCreateOrders: true,
    canManageOrders: true,
    canViewOrders: true,
    canManageAppointments: true,
    canViewAppointments: true,
    canManageInvoices: true,
    canViewInvoices: true,
    canManageWarehouse: true,
    canViewWarehouse: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAiHelper: true,
    // Nowe uprawnienia
    canViewAnalytics: true,
    canManageServicePrices: true,
    canViewServicePrices: true,
    canViewVehicleHistory: true,
    canManageSchedule: true,
    canViewSchedule: true,
    canManageSuppliers: true,
    canViewSuppliers: true,
    canViewRatings: true,
    canManageEmailTemplates: true,
  },
  kierownik: {
    // Kierownik = Manager - full access to operations
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: true,
    canViewCustomers: true,
    canManageVehicles: true,
    canViewVehicles: true,
    canCreateOrders: true,
    canManageOrders: true,
    canViewOrders: true,
    canManageAppointments: true,
    canViewAppointments: true,
    canManageInvoices: true,
    canViewInvoices: true,
    canManageWarehouse: true,
    canViewWarehouse: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAiHelper: true,
    // Nowe uprawnienia
    canViewAnalytics: true,
    canManageServicePrices: false,
    canViewServicePrices: true,
    canViewVehicleHistory: true,
    canManageSchedule: true,
    canViewSchedule: true,
    canManageSuppliers: false,
    canViewSuppliers: false,
    canViewRatings: true,
    canManageEmailTemplates: false,
  },
  mechanik: {
    // Mechanik = Mechanic - can view orders and appointments
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: false,
    canViewCustomers: true,
    canManageVehicles: false,
    canViewVehicles: true,
    canCreateOrders: false,
    canManageOrders: true,
    canViewOrders: true,
    canManageAppointments: false,
    canViewAppointments: true,
    canManageInvoices: false,
    canViewInvoices: false,
    canManageWarehouse: false,
    canViewWarehouse: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAiHelper: false,
    // Nowe uprawnienia
    canViewAnalytics: false,
    canManageServicePrices: false,
    canViewServicePrices: true,
    canViewVehicleHistory: true,
    canManageSchedule: true,
    canViewSchedule: true,
    canManageSuppliers: false,
    canViewSuppliers: false,
    canViewRatings: true,
    canManageEmailTemplates: false,
  },
  recepcja: {
    // Recepcja = Reception - can manage customers and appointments
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: true,
    canViewCustomers: true,
    canManageVehicles: true,
    canViewVehicles: true,
    canCreateOrders: true,
    canManageOrders: true,
    canViewOrders: true,
    canManageAppointments: true,
    canViewAppointments: true,
    canManageInvoices: false,
    canViewInvoices: true,
    canManageWarehouse: false,
    canViewWarehouse: true,
    canManageMessages: true,
    canViewMessages: true,
    canViewAiHelper: false,
    // Nowe uprawnienia
    canViewAnalytics: false,
    canManageServicePrices: true,
    canViewServicePrices: true,
    canViewVehicleHistory: false,
    canManageSchedule: true,
    canViewSchedule: true,
    canManageSuppliers: true,
    canViewSuppliers: true,
    canViewRatings: false,
    canManageEmailTemplates: false,
  },
  user: {
    // Regular user (customer) - can only see and manage own data
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: false,
    canViewCustomers: false,        // Cannot see other customers
    canManageVehicles: false,
    canViewVehicles: true,          // Can see own vehicles
    canCreateOrders: false,
    canManageOrders: false,
    canViewOrders: true,            // Can see own orders
    canManageAppointments: true,    // Can create appointments for own vehicles
    canViewAppointments: true,      // Can see own appointments
    canManageInvoices: false,
    canViewInvoices: false,         // Cannot see invoices
    canManageWarehouse: false,
    canViewWarehouse: false,        // Cannot see warehouse
    canManageMessages: false,
    canViewMessages: true,          // Can see only own messages
    canViewAiHelper: true,          // Can use AI helper
    // Nowe uprawnienia
    canViewAnalytics: false,
    canManageServicePrices: false,
    canViewServicePrices: true,     // Can see available services
    canViewVehicleHistory: true,    // Can see own vehicle history
    canManageSchedule: false,
    canViewSchedule: false,
    canManageSuppliers: false,
    canViewSuppliers: false,
    canViewRatings: true,           // Can see and create ratings
    canManageEmailTemplates: false,
  },
};

export function getPermissions(role: UserRole): RolePermissions {
  return rolePermissions[normalizeRole(role) as keyof typeof rolePermissions] || rolePermissions.user;
}

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  const perms = getPermissions(role);
  return perms[permission];
}

export function normalizeRole(role?: string): 'admin' | 'kierownik' | 'mechanik' | 'recepcja' | 'user' {
  const r = String(role ?? '').trim().toLowerCase();
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'kierownik' || r === 'manager') return 'kierownik';
  if (r === 'mechanik' || r === 'mechanic') return 'mechanik';
  if (r === 'recepcja' || r === 'receptionist') return 'recepcja';
  return 'user';
}

