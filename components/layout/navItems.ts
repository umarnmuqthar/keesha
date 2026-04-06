import { 
  Home, 
  Receipt, 
  Users, 
  CreditCard, 
  Landmark, 
  Repeat 
} from 'lucide-react';

export const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/debt', label: 'Debt', icon: Users },
  { href: '/creditcards', label: 'Cards', icon: CreditCard },
  { href: '/loans', label: 'Loans', icon: Landmark },
  { href: '/subscriptions', label: 'Subscriptions', icon: Repeat }
];
