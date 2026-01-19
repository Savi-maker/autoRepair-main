export const API_URL = (import.meta as any).env?.VITE_API_URL || "/api";

/* =========================
   TYPES
   ========================= */

export interface ProfileType {
  id: number;
  imie: string;
  nazwisko: string;
  mail: string;
  telefon: string;
  rola: string;
}

export interface OrderType {
  id: number;
  service: string;
  status: string;
  opis: string | null;
  customer_id: number;
  vehicle_id: number;
  mechanic_user_id: number | null;
  created_by_user_id: number | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

export interface CustomerType {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleType {
  id: number;
  customer_id: number;
  make: string;
  model: string;
  year: number | null;
  plate: string;
  vin: string | null;
  last_service_at: string | null;
  created_at: string;
}

export interface AppointmentType {
  id: number;
  title: string;
  start_at: string;
  end_at: string | null;
  status: string;
  customer_id: number | null;
  vehicle_id: number | null;
  order_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface PartType {
  id: number;
  name: string;
  sku: string;
  brand: string | null;
  stock: number;
  min_stock: number;
  price: number;
  location: string | null;
  created_at: string;
}

export interface InvoiceType {
  id: number;
  number: string;
  customer_id: number;
  order_id: number | null;
  issue_date: string;
  due_date: string | null;
  amount: number;
  status: string;
  pdf_path: string | null;
  created_at: string;
}

export interface ThreadType {
  id: number;
  title: string;
  customer_id: number | null;
  order_id: number | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  customer_name?: string | null;
  order_service?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
}

export interface MessageType {
  id: number;
  thread_id: number;
  sender_user_id: number | null;
  sender_customer_id: number | null;
  text: string;
  created_at: string;
}

export interface NotificationType {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  allowed?: string[];
}

/* =========================
   TOKEN
   ========================= */

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

/* =========================
   CORE FETCH
   ========================= */

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      // response is not valid JSON (e.g. HTML error page); keep text for diagnostics
      json = null;
    }

    if (!res.ok) {
      return {
        success: false,
        message: json?.message || json?.error || (text ? text.substring(0, 200) : "Request failed"),
        error: json?.error,
        allowed: json?.allowed,
      };
    }

    if (json && typeof json.success === "boolean") return json as ApiResponse<T>;

    // if response was successful but not JSON, return the text as data for debugging
    if (!json && text) return { success: true, message: "OK", data: (text as unknown) as T };

    return { success: true, message: "OK", data: json as T };
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error" };
  }
}

/* =========================
   AUTH
   ========================= */

export async function login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
  const resp = await apiFetch<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ mail: email, haslo: password }),
  });

  if (resp.success) {
    const token = (resp.data as any)?.token;
    if (token) setToken(token);
  }

  return resp;
}

export function registerProfile(data: {
  imie: string;
  nazwisko: string;
  mail: string;
  telefon?: string;
  haslo: string;
  rola?: string;
}): Promise<ApiResponse> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function resetPassword(data: { mail: string; imie: string; nowe_haslo: string }): Promise<ApiResponse> {
  return apiFetch("/auth/reset", {
    method: "POST",
    body: JSON.stringify({ mail: data.mail, imie: data.imie, nowe_haslo: data.nowe_haslo }),
  });
}

export async function logout(): Promise<ApiResponse> {
  removeToken();
  return { success: true, message: "Wylogowano" };
}

/* =========================
   PROFILE / ME
   ========================= */

export async function getMyProfile(): Promise<ProfileType> {
  const resp = await apiFetch<ProfileType>("/profile", { method: "GET" });
  if (resp.success && resp.data) return resp.data;
  return { id: 0, imie: "", nazwisko: "", mail: "", telefon: "", rola: "" };
}

export function updateMyProfile(data: Partial<Pick<ProfileType, "imie" | "nazwisko" | "mail" | "telefon">>): Promise<ApiResponse<ProfileType>> {
  return apiFetch<ProfileType>("/profile", { method: "PATCH", body: JSON.stringify(data) });
}

/* =========================
   ORDERS
   ========================= */

export function getOrders(): Promise<ApiResponse<OrderType[]>> {
  return apiFetch<OrderType[]>("/orders", { method: "GET" });
}

export function getOrderById(id: number): Promise<ApiResponse<OrderType>> {
  return apiFetch<OrderType>(`/orders/${id}`, { method: "GET" });
}

export function createOrder(data: {
  service: string;
  opis?: string;
  customer_id: number;
  vehicle_id: number;
  mechanic_user_id?: number | null;
  start_at?: string | null;
  end_at?: string | null;
}): Promise<ApiResponse<OrderType>> {
  return apiFetch<OrderType>("/orders", { method: "POST", body: JSON.stringify(data) });
}

export function updateOrder(id: number, data: { status?: string; opis?: string }): Promise<ApiResponse<OrderType>> {
  return apiFetch<OrderType>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteOrder(id: number): Promise<ApiResponse> {
  return apiFetch(`/orders/${id}`, { method: "DELETE" });
}

/* =========================
   CUSTOMERS
   ========================= */

export function getCustomers(): Promise<ApiResponse<CustomerType[]>> {
  return apiFetch<CustomerType[]>("/customers", { method: "GET" });
}

export function createCustomer(data: { name: string; email?: string; phone?: string; notes?: string }): Promise<ApiResponse<CustomerType>> {
  return apiFetch<CustomerType>("/customers", { method: "POST", body: JSON.stringify(data) });
}

export function updateCustomer(id: number, data: Partial<CustomerType>): Promise<ApiResponse<CustomerType>> {
  return apiFetch<CustomerType>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteCustomer(id: number): Promise<ApiResponse> {
  return apiFetch(`/customers/${id}`, { method: "DELETE" });
}

/* =========================
   VEHICLES
   ========================= */

export function getVehicles(): Promise<ApiResponse<VehicleType[]>> {
  return apiFetch<VehicleType[]>("/vehicles", { method: "GET" });
}

export function createVehicle(data: {
  customer_id: number;
  make: string;
  model: string;
  year?: number;
  plate: string;
  vin?: string;
}): Promise<ApiResponse<VehicleType>> {
  return apiFetch<VehicleType>("/vehicles", { method: "POST", body: JSON.stringify(data) });
}

export function updateVehicle(id: number, data: Partial<VehicleType>): Promise<ApiResponse<VehicleType>> {
  return apiFetch<VehicleType>(`/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteVehicle(id: number): Promise<ApiResponse> {
  return apiFetch(`/vehicles/${id}`, { method: "DELETE" });
}

/* =========================
   APPOINTMENTS
   ========================= */

export function getAppointments(): Promise<ApiResponse<AppointmentType[]>> {
  return apiFetch<AppointmentType[]>("/appointments", { method: "GET" });
}

export function createAppointment(data: Partial<AppointmentType>): Promise<ApiResponse<AppointmentType>> {
  return apiFetch<AppointmentType>("/appointments", { method: "POST", body: JSON.stringify(data) });
}

export function updateAppointment(id: number, data: Partial<AppointmentType>): Promise<ApiResponse<AppointmentType>> {
  return apiFetch<AppointmentType>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteAppointment(id: number): Promise<ApiResponse> {
  return apiFetch(`/appointments/${id}`, { method: "DELETE" });
}

/* =========================
   PARTS (MAGAZYN)
   ========================= */

export function getParts(): Promise<ApiResponse<PartType[]>> {
  return apiFetch<PartType[]>("/parts", { method: "GET" });
}

export function getLowStockParts(): Promise<ApiResponse<PartType[]>> {
  return apiFetch<PartType[]>("/parts/low-stock", { method: "GET" });
}

export function createPart(data: Partial<PartType>): Promise<ApiResponse<PartType>> {
  return apiFetch<PartType>("/parts", { method: "POST", body: JSON.stringify(data) });
}

export function updatePart(id: number, data: Partial<PartType>): Promise<ApiResponse<PartType>> {
  return apiFetch<PartType>(`/parts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deletePart(id: number): Promise<ApiResponse> {
  return apiFetch(`/parts/${id}`, { method: "DELETE" });
}

/* =========================
   INVOICES
   ========================= */

export function getInvoices(): Promise<ApiResponse<InvoiceType[]>> {
  return apiFetch<InvoiceType[]>("/invoices", { method: "GET" });
}

export function createInvoice(data: Partial<InvoiceType>): Promise<ApiResponse<InvoiceType>> {
  return apiFetch<InvoiceType>("/invoices", { method: "POST", body: JSON.stringify(data) });
}

export function updateInvoice(id: number, data: Partial<InvoiceType>): Promise<ApiResponse<InvoiceType>> {
  return apiFetch<InvoiceType>(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteInvoice(id: number): Promise<ApiResponse> {
  return apiFetch(`/invoices/${id}`, { method: "DELETE" });
}

/* =========================
   NOTIFICATIONS
   ========================= */

export function getNotifications(): Promise<ApiResponse<NotificationType[]>> {
  return apiFetch<NotificationType[]>("/notifications", { method: "GET" });
}

export function markNotificationRead(id: number): Promise<ApiResponse<NotificationType>> {
  return apiFetch<NotificationType>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(): Promise<ApiResponse> {
  return apiFetch(`/notifications/read-all`, { method: "PATCH" });
}

export function deleteNotification(id: number): Promise<ApiResponse> {
  return apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

/* =========================
   MESSAGES (CHAT)
   ========================= */

export function getThreads(q?: string): Promise<ApiResponse<ThreadType[]>> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<ThreadType[]>(`/messages/threads${qs}`, { method: "GET" });
}

export function createThread(data: { title: string; customer_id?: number; order_id?: number }): Promise<ApiResponse<ThreadType>> {
  return apiFetch<ThreadType>(`/messages/threads`, { method: "POST", body: JSON.stringify(data) });
}

export function getThreadMessages(threadId: number): Promise<ApiResponse<MessageType[]>> {
  return apiFetch<MessageType[]>(`/messages/threads/${threadId}/messages`, { method: "GET" });
}

export function sendMessage(threadId: number, text: string): Promise<ApiResponse<MessageType>> {
  return apiFetch<MessageType>(`/messages/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/* =========================
   ADMIN USERS
   ========================= */

export interface AdminUserType {
  id: number;
  imie: string;
  nazwisko: string;
  mail: string;
  telefon: string | null;
  rola: string;
  status?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
}

export function getUsersAdmin(): Promise<ApiResponse<AdminUserType[]>> {
  return apiFetch<AdminUserType[]>("/admin/users", { method: "GET" });
}

export function createUserAdmin(data: {
  imie: string;
  nazwisko: string;
  mail: string;
  telefon?: string;
  haslo: string;
  rola?: string;
}): Promise<ApiResponse<AdminUserType>> {
  return apiFetch<AdminUserType>("/admin/users", { method: "POST", body: JSON.stringify(data) });
}

export function updateUserAdmin(id: number, data: Partial<Pick<AdminUserType, "rola" | "status" | "telefon" | "mail" | "imie" | "nazwisko">>): Promise<ApiResponse<AdminUserType>> {
  return apiFetch<AdminUserType>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function adminResetUserPassword(data: { mail: string; imie: string; nowe_haslo: string }): Promise<ApiResponse> {
  return resetPassword(data);
}
