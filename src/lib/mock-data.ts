export type Network = "MTN" | "AirtelTigo" | "Telecel";

export interface DataBundle {
  id: string;
  network: Network;
  size: string;
  regularPrice: number;
  agentPrice: number;
  validity: string;
  popular?: boolean;
  cheapest?: boolean;
}

export interface Order {
  id: string;
  phone: string;
  network: Network;
  bundle: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  date: string;
  customer?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSales: number;
  earnings: number;
  subAgents: number;
  status: "active" | "blocked";
  joinDate: string;
}

export const networks: { name: Network; color: string; logo: string }[] = [
  { name: "MTN", color: "#FFD600", logo: "📶" },
  { name: "AirtelTigo", color: "#E4002B", logo: "📡" },
  { name: "Telecel", color: "#00A651", logo: "📱" },
];

export const dataBundles: DataBundle[] = [
  // MTN
  { id: "mtn-1", network: "MTN", size: "1GB", regularPrice: 5, agentPrice: 4, validity: "No Expiry" },
  { id: "mtn-2", network: "MTN", size: "2GB", regularPrice: 9, agentPrice: 7.5, validity: "No Expiry" },
  { id: "mtn-3", network: "MTN", size: "5GB", regularPrice: 20, agentPrice: 16, validity: "No Expiry", popular: true },
  { id: "mtn-4", network: "MTN", size: "10GB", regularPrice: 35, agentPrice: 28, validity: "No Expiry", cheapest: true },
  { id: "mtn-5", network: "MTN", size: "20GB", regularPrice: 60, agentPrice: 48, validity: "No Expiry" },
  { id: "mtn-6", network: "MTN", size: "50GB", regularPrice: 120, agentPrice: 96, validity: "No Expiry" },
  // AirtelTigo
  { id: "at-1", network: "AirtelTigo", size: "1GB", regularPrice: 4.5, agentPrice: 3.5, validity: "No Expiry", cheapest: true },
  { id: "at-2", network: "AirtelTigo", size: "2GB", regularPrice: 8, agentPrice: 6.5, validity: "No Expiry" },
  { id: "at-3", network: "AirtelTigo", size: "5GB", regularPrice: 18, agentPrice: 14.5, validity: "No Expiry", popular: true },
  { id: "at-4", network: "AirtelTigo", size: "10GB", regularPrice: 32, agentPrice: 26, validity: "No Expiry" },
  { id: "at-5", network: "AirtelTigo", size: "20GB", regularPrice: 55, agentPrice: 44, validity: "No Expiry" },
  // Telecel
  { id: "tc-1", network: "Telecel", size: "1GB", regularPrice: 4.8, agentPrice: 3.8, validity: "No Expiry" },
  { id: "tc-2", network: "Telecel", size: "2GB", regularPrice: 8.5, agentPrice: 7, validity: "No Expiry" },
  { id: "tc-3", network: "Telecel", size: "5GB", regularPrice: 19, agentPrice: 15, validity: "No Expiry", popular: true },
  { id: "tc-4", network: "Telecel", size: "10GB", regularPrice: 33, agentPrice: 27, validity: "No Expiry", cheapest: true },
  { id: "tc-5", network: "Telecel", size: "15GB", regularPrice: 45, agentPrice: 36, validity: "No Expiry" },
];

export const recentOrders: Order[] = [
  { id: "ORD-001", phone: "024 555 1234", network: "MTN", bundle: "5GB", amount: 20, status: "completed", date: "2026-04-07", customer: "Kwame A." },
  { id: "ORD-002", phone: "027 888 5678", network: "AirtelTigo", bundle: "2GB", amount: 8, status: "completed", date: "2026-04-07", customer: "Ama B." },
  { id: "ORD-003", phone: "020 123 4567", network: "Telecel", bundle: "10GB", amount: 33, status: "pending", date: "2026-04-06" },
  { id: "ORD-004", phone: "024 999 0000", network: "MTN", bundle: "1GB", amount: 5, status: "completed", date: "2026-04-06", customer: "Kofi D." },
  { id: "ORD-005", phone: "026 777 3333", network: "MTN", bundle: "20GB", amount: 60, status: "failed", date: "2026-04-05" },
  { id: "ORD-006", phone: "024 111 2222", network: "AirtelTigo", bundle: "5GB", amount: 18, status: "completed", date: "2026-04-05", customer: "Efua K." },
  { id: "ORD-007", phone: "020 333 4444", network: "Telecel", bundle: "2GB", amount: 8.5, status: "completed", date: "2026-04-04" },
  { id: "ORD-008", phone: "024 666 7777", network: "MTN", bundle: "50GB", amount: 120, status: "completed", date: "2026-04-04", customer: "Yaw M." },
];

export const agents: Agent[] = [
  { id: "AGT-001", name: "John Mensah", email: "john@example.com", phone: "024 555 0001", totalSales: 450, earnings: 1250, subAgents: 5, status: "active", joinDate: "2026-01-15" },
  { id: "AGT-002", name: "Akua Boateng", email: "akua@example.com", phone: "027 555 0002", totalSales: 320, earnings: 890, subAgents: 3, status: "active", joinDate: "2026-02-01" },
  { id: "AGT-003", name: "Kwesi Appiah", email: "kwesi@example.com", phone: "020 555 0003", totalSales: 180, earnings: 520, subAgents: 1, status: "active", joinDate: "2026-02-20" },
  { id: "AGT-004", name: "Abena Owusu", email: "abena@example.com", phone: "026 555 0004", totalSales: 95, earnings: 280, subAgents: 0, status: "blocked", joinDate: "2026-03-10" },
];

export const salesData = [
  { month: "Jan", sales: 1200 },
  { month: "Feb", sales: 1800 },
  { month: "Mar", sales: 2400 },
  { month: "Apr", sales: 3100 },
  { month: "May", sales: 2800 },
  { month: "Jun", sales: 3500 },
  { month: "Jul", sales: 4200 },
];

export const testimonials = [
  { name: "Kwame Asante", role: "Data Reseller", text: "SwiftData has transformed my side hustle into a real business. The agent discounts are incredible!", avatar: "KA" },
  { name: "Ama Serwaa", role: "Student", text: "I buy my monthly data here. It's faster and cheaper than going to a shop. Love it!", avatar: "AS" },
  { name: "Kofi Mensah", role: "Agent", text: "I've recruited 12 sub-agents and earn passive income weekly. The platform is easy to use.", avatar: "KM" },
];
