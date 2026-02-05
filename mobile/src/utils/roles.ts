export type UserRole =
  | 'admin'
  | 'kierownik'
  | 'mechanik'
  | 'recepcja'
  | 'klient'
  | 'user'
  | 'manager'
  | 'mechanic'
  | 'receptionist'
  | 'client';

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

const rolePermissions: Record<'admin' | 'kierownik' | 'mechanik' | 'recepcja' | 'klient' | 'user', RolePermissions> = {
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

    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: false,
    canViewCustomers: false,
    canManageVehicles: false,
    canViewVehicles: true,
    canCreateOrders: false,
    canManageOrders: false,
    canViewOrders: true,
    canManageAppointments: true,
    canViewAppointments: true,
    canManageInvoices: false,
    canViewInvoices: false,
    canManageWarehouse: false,
    canViewWarehouse: false,
    canManageMessages: false,
    canViewMessages: true,
    canViewAiHelper: true,

    canViewAnalytics: false,
    canManageServicePrices: false,
    canViewServicePrices: true,
    canViewVehicleHistory: true,
    canManageSchedule: false,
    canViewSchedule: false,
    canManageSuppliers: false,
    canViewSuppliers: false,
    canViewRatings: true,
    canManageEmailTemplates: false,
  },
  klient: {

    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: false,
    canViewCustomers: false,
    canManageVehicles: true,
    canViewVehicles: true,
    canCreateOrders: true,
    canManageOrders: false,
    canViewOrders: true,
    canManageAppointments: true,
    canViewAppointments: true,
    canManageInvoices: false,
    canViewInvoices: true,
    canManageWarehouse: false,
    canViewWarehouse: false,
    canManageMessages: true,
    canViewMessages: true,
    canViewAiHelper: true,

    canViewAnalytics: false,
    canManageServicePrices: false,
    canViewServicePrices: true,
    canViewVehicleHistory: true,
    canManageSchedule: false,
    canViewSchedule: false,
    canManageSuppliers: false,
    canViewSuppliers: false,
    canViewRatings: true,
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

export function normalizeRole(role?: string): 'admin' | 'kierownik' | 'mechanik' | 'recepcja' | 'klient' | 'user' {
  const r = String(role ?? '').trim().toLowerCase();
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'kierownik' || r === 'manager') return 'kierownik';
  if (r === 'mechanik' || r === 'mechanic') return 'mechanik';
  if (r === 'recepcja' || r === 'receptionist') return 'recepcja';
  if (r === 'klient' || r === 'client') return 'klient';
  return 'user';
}

