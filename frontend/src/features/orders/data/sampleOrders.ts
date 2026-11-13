import type { Order } from '../types/order'

export const sampleOrders: Order[] = [
  { id: 'WD-2481', name: 'Amara Okafor', initials: 'AO', items: '4 shirts, 2 trousers, 2 dresses', due: 'Today, 2:30 PM', status: 'Washing', tone: 'blue', amount: 'GH₵244.00' },
  { id: 'WD-2480', name: 'Jonah Miller', initials: 'JM', items: '2 suits, 1 jacket', due: 'Today, 1:00 PM', status: 'Ready for Pickup', tone: 'green', amount: 'GH₵375.00' },
  { id: 'WD-2479', name: 'Sofia Chen', initials: 'SC', items: '6 shirts, 4 trousers, 2 skirts', due: 'Today, 4:00 PM', status: 'Drying', tone: 'amber', amount: 'GH₵468.00' },
  { id: 'WD-2478', name: 'Marcus Reed', initials: 'MR', items: '1 duvet, 1 bedsheet', due: 'Tomorrow, 9:00 AM', status: 'Received', tone: 'violet', amount: 'GH₵180.00' },
  { id: 'WD-2477', name: 'Elena Petrova', initials: 'EP', items: '2 curtains, 4 pillowcases', due: 'Today, 12:30 PM', status: 'Ironing', tone: 'rose', amount: 'GH₵522.00' },
]
