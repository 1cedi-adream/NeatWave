import type { Order } from '../types/order'

export const sampleOrders: Order[] = [
  { id: 'WD-2481', name: 'Amara Okafor', phone: '+233 24 111 2481', initials: 'AO', items: '8 items', due: 'Today, 2:30 PM', status: 'Washing', tone: 'blue', amount: 'GH₵244.00' },
  { id: 'WD-2480', name: 'Jonah Miller', phone: '+233 24 111 2480', initials: 'JM', items: '3 items', due: 'Today, 1:00 PM', status: 'Ready for Pickup', tone: 'green', amount: 'GH₵375.00' },
  { id: 'WD-2479', name: 'Sofia Chen', phone: '+233 24 111 2479', initials: 'SC', items: '12 items', due: 'Today, 4:00 PM', status: 'Out for Delivery', tone: 'amber', amount: 'GH₵468.00' },
  { id: 'WD-2478', name: 'Marcus Reed', phone: '+233 24 111 2478', initials: 'MR', items: '2 items', due: 'Tomorrow, 9:00 AM', status: 'Received', tone: 'violet', amount: 'GH₵180.00' },
  { id: 'WD-2477', name: 'Elena Petrova', phone: '+233 24 111 2477', initials: 'EP', items: '6 items', due: 'Today, 12:30 PM', status: 'Received', tone: 'rose', amount: 'GH₵522.00' },
]
