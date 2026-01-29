import { useEffect, useState } from 'react';
import { ProfileType, getMyProfile } from './api';
import { hasPermission, RolePermissions, getPermissions } from './roles';

interface AuthContextType {
  user: ProfileType | null;
  loading: boolean;
  isAuthenticated: boolean;
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>({
    canViewAdminPanel: false,
    canManageUsers: false,
    canManageCustomers: false,
    canViewCustomers: false,
    canManageVehicles: false,
    canViewVehicles: false,
    canCreateOrders: false,
    canManageOrders: false,
    canViewOrders: false,
    canManageAppointments: false,
    canViewAppointments: false,
    canManageInvoices: false,
    canViewInvoices: false,
    canManageWarehouse: false,
    canViewWarehouse: false,
    canManageMessages: false,
    canViewMessages: false,
    canViewAiHelper: false,
    canViewAnalytics: false,
    canManageServicePrices: false,
    canViewServicePrices: false,
    canViewVehicleHistory: false,
    canManageSchedule: false,
    canViewSchedule: false,
    canManageSuppliers: false,
    canViewSuppliers: false,
    canViewRatings: false,
    canManageEmailTemplates: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const profile = await getMyProfile();
        if (profile && profile.id) {
          setUser(profile);
          const userPerms = getPermissions(profile.rola as any);
          setPermissions(userPerms);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user?.id,
    permissions,
    hasPermission: (permission: keyof RolePermissions) =>
      user ? hasPermission(user.rola as any, permission) : false,
  };
}

