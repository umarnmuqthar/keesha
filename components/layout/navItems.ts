import { 
  Home, 
  Receipt, 
  Users, 
  CreditCard, 
  Landmark, 
  Repeat,
  Wallet,
  User
} from 'lucide-react';

export const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/incomes', label: 'Income', icon: Wallet },
  { href: '/debt', label: 'Debt', icon: Users },
  { href: '/creditcards', label: 'Cards', icon: CreditCard },
  { href: '/loans', label: 'Loans', icon: Landmark },
  { href: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { href: '/profile', label: 'Profile', icon: User }
];
