# Keesha Finance Tracker

A modern, intuitive personal finance application designed to help you track subscriptions, manage debts, and visualize your financial health with a polished, premium user interface.

![Keesha Dashboard App](/uploaded_media_1769863726719.png)

## 🌟 Features

- **Subscription Command Center**: 
  - Track Active, Paused, and Cancelled subscriptions.
  - view details cost breakdowns (Monthly/Yearly).
  - "Mark as Paid" functionality for manual tracking.
  - Smart sorting and categorization.

- **Debt & EMI Tracker**:
  - Dedicated cards for tracking personal debts and repayment progress.
  - EMI calculator and tracker to stay on top of monthly installments.

- **Financial Dashboard**:
  - High-level overview of total monthly spending.
  - Visual charts and metrics to analyze spending habits.
  - "Upcoming Renewals" alerts.

- **User Experience**:
  - **Sleek UI**: Modern aesthetics with glassmorphism effects and smooth transitions.
  - **Profile Management**: Upload and crop profile pictures.
  - **Responsive Design**: Optimized for desktop and mobile views.

## 🛠️ Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) (App Directory)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & CSS Modules for custom components
- **Database**: [Firebase](https://firebase.google.com/) & [Prisma](https://www.prisma.io/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Image Processing**: React Easy Crop

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/umarnmuqthar/keesha.git
   cd keesha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your credentials (see `.env.example`):
   ```env
   DATABASE_URL="your_database_url"
   NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_key"
   # ... add other firebase config keys
   FIREBASE_SERVICE_ACCOUNT_KEY="your_firebase_service_account_json"
   GMAIL_USER="your_gmail_address"
   GMAIL_APP_PASSWORD="your_gmail_app_password"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧭 App Routes

Public routes:
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

Main app routes:
- `/` (Dashboard)
- `/subscriptions` and `/subscriptions/[id]`
- `/loans` and `/loans/[id]`
- `/creditcards` and `/creditcards/[id]`
- `/debt` and `/debt/[id]`
- `/profile`

Admin routes:
- `/admin/login`
- `/admin`
- `/admin/users`

### Firestore Rules Deployment
We keep Firestore rules in `firestore.rules` for version control. To deploy:

```bash
firebase deploy --only firestore:rules
```

This will overwrite the rules currently set in the Firebase Console.

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## 📄 License

This project is licensed under the MIT License.
