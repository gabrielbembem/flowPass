import { ObjectId } from "mongodb";
import { Types } from "mongoose";

// Enums para os valores fixos
export enum UserProfile {
  Usuário = "Usuário",
  Promoter = "Promotor",
  Administrador = "Administrador",
  Employee = "Funcionário",
  Mentoria = "Mentoria",
  Diretoria = "Diretoria",
}

// Interface para o histórico
export interface UpdateHistoryData {
  name?: string;
  listDate?: Date;
  isExam?: boolean;
  examScore?: number;
  users?: HistoryUser[];
  listId: string;
}

interface Ticket {
  paying: boolean;
  reason: string;
  approver: Types.ObjectId | null;
}

interface HistoryUser {
  id: any;
  firstRound: boolean;
  secondRound: boolean;
  examScore: number;
  ticket: Ticket;
  entrada: Date | null;
}

export interface History {
  _id?: ObjectId;
  listId: string | null;
  name: string;
  joinedAt: Date;
  listDate: Date | null;
  users?: HistoryUser[];
  isExam: boolean;
  eventName: string;
}

export type IEventUpdate = Partial<IEvent> & {
  lists?: string[]; // Especifica que podemos atualizar apenas lists
};

export interface History2 {
  _id?: ObjectId;
  listId: string;
  joinedAt: Date;
  name: string;
  firstRound: boolean;
  secondRound: boolean;
  isExam: boolean;
  examScore: number;
  ticket: Ticket;
}

export enum PenaltyDuration {
  FifteenDays = "15 dias",
  ThirtyDays = "30 dias",
  ThreeMonths = "3 meses",
  SixMonths = "6 meses",
}

export interface IPenalty {
  observation: string;
  duration: PenaltyDuration;
  startDate: string;
}

export interface IUser {
  _id?: string;
  name: string;
  cpf: string;
  birthDate: Date | null;
  phone?: string;
  gender: string;
  profile: string;
  anniversary: boolean;
  penalties: IPenalty[];
  currentList?: string;
  cash: number;
  client_id: string;
  password?: string;
  histories?: History[];
  history?: History2[];
  // Campos para funcionalidade de foto
  photoPath?: string;
  photoUpdatedAt?: Date;
}

export interface List {
  _id?: string;
  title: string;
  owner?: IUser;
  startDate: Date;
  endDate: Date;
  domain: string;
  isExam: boolean;
  eventId: IEvent;
  historico?: History;
  eventName?: string;
}

export interface IPromoter {
  _id?: string; // Opcional, pois só é definido após a criação no backend
  name: string;
  cpf: string;
  birthDate: Date | null;
  phone: string;
  gender: string;
  cash: number;
}

export interface UserLocalStorage {
  id: string;
  name: string;
  cpf: string;
  profile: string;
  client_id: string;
}

export interface IEvent {
  _id?: string;
  title: string;
  owner: IUser;
  startDate: Date | null;
  endDate: Date | null;
  lists: List[];
  domain: string;
  basePrice: number;
  femaleBasePrice: number;
  maleBasePrice: number;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
