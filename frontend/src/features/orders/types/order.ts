import type { OrderStatus } from "../../../constants/orderStatuses";

export type Order = {
  id: string
  name: string
  phone: string
  initials: string
  items: string
  due: string
  status: OrderStatus
  tone: string
  amount: string
}

export type Receipt = {
  id: string
  name: string
  phone: string
  items: string
  amount: string
  payment: string
}
