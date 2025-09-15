# 🏠 Buyer Lead Intake App

A modern, full-stack web application for managing real estate buyer leads with comprehensive features including lead tracking, status management, CSV import/export, and detailed history tracking.

## 🚀 Features

### Core Functionality
- **Lead Management**: Create, view, edit, and delete buyer leads
- **Status Tracking**: Real-time status updates with inline editing
- **Search & Filtering**: Advanced search across multiple fields with filters
- **Pagination**: Efficient pagination with customizable page sizes
- **CSV Import/Export**: Bulk data operations with validation
- **History Tracking**: Complete audit trail of all changes
- **Rate Limiting**: Built-in protection against abuse

### Technical Features
- **Next.js 15** with App Router and Turbopack
- **TypeScript** for type safety
- **Prisma ORM** with SQLite database
- **Zod Validation** for data integrity
- **React Hooks** with performance optimizations
- **Responsive Design** with Tailwind CSS
- **Rate Limiting** with in-memory storage

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd buyer_lead_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Next.js
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional: For production
   NODE_ENV="development"
   ```

### Database Setup

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Optional: Seed Database** (if seed script exists)
   ```bash
   npx prisma db seed
   ```

### Running Locally

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   Navigate to `http://localhost:3000`

3. **Database Management**
   ```bash
   # View database in Prisma Studio
   npx prisma studio
   
   # Reset database
   npx prisma migrate reset
   ```

## 📁 Project Structure

```
buyer_lead_app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── buyers/        # Buyer CRUD operations
│   │   │   ├── login/         # Authentication
│   │   │   └── ...
│   │   ├── buyers/            # Buyer pages
│   │   │   ├── [id]/          # Dynamic buyer pages
│   │   │   ├── new/           # Create buyer page
│   │   │   └── page.tsx       # Buyers listing page
│   │   └── globals.css        # Global styles
│   ├── lib/                   # Shared utilities
│   │   ├── prisma.ts          # Database connection
│   │   ├── rate-limit.ts      # Rate limiting logic
│   │   └── validators/        # Zod schemas
│   └── ...
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── dev.db                 # SQLite database
├── tests/                     # Test files
├── docs/                      # Documentation
└── package.json
```

## 🏗️ Architecture & Design Notes

### Validation Strategy

**Client-Side Validation**
- Form validation using Zod schemas
- Real-time feedback for user inputs
- Prevents unnecessary API calls

**Server-Side Validation**
- All API endpoints validate input with Zod
- Database constraints as final safety net
- Comprehensive error handling

**Validation Layers**
```typescript
// 1. Client-side (immediate feedback)
const formSchema = z.object({...});

// 2. API validation (security)
const parsed = buyerSchema.parse(body);

// 3. Database constraints (data integrity)
model Buyer {
  id String @id @default(uuid())
  // ... constraints
}
```

### SSR vs Client-Side Rendering

**Server-Side Rendering (SSR)**
- Initial page loads for better SEO
- Faster first contentful paint
- Reduced client-side JavaScript

**Client-Side Rendering (CSR)**
- Interactive components (`"use client"`)
- Real-time updates and state management
- Dynamic filtering and search

**Hybrid Approach**
```typescript
// Server Component (SSR)
export default function BuyersPage() {
  // Initial data fetching
}

// Client Component (CSR)
"use client";
export function BuyerRow({ buyer }) {
  // Interactive features
}
```

### Ownership Enforcement

**Current Implementation**
- Mock user ID: `"user-id-123"`
- All operations use the same user
- Ready for real authentication

**Future Authentication Integration**
```typescript
// Current
ownerId: "user-id-123"

// Future with auth
ownerId: getCurrentUser().id
```

**Data Isolation Strategy**
- Database-level ownership constraints
- API-level user validation
- UI-level permission checks

## 🔒 Security Features

### Rate Limiting
- **Buyer Creation**: 10 requests/hour
- **Buyer Updates**: 50 requests/hour  
- **CSV Import**: No limit (unrestricted)
- **General API**: No limit (unrestricted)

### Data Validation
- Input sanitization with Zod
- SQL injection prevention via Prisma
- XSS protection with React

### Error Handling
- Graceful error responses
- Detailed logging in development
- Generic errors in production

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Component Tests**: React component testing

## 📊 Database Schema

### Core Models

**Buyer**
```prisma
model Buyer {
  id          String   @id @default(uuid())
  fullName    String
  email       String?
  phone       String
  city        City
  propertyType PropertyType
  bhk         BHK?
  purpose     Purpose
  budgetMin   Int?
  budgetMax   Int?
  timeline    Timeline
  source      Source
  status      Status   @default(New)
  notes       String?
  tags        String[]
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  BuyerHistory BuyerHistory[]
}
```

**BuyerHistory**
```prisma
model BuyerHistory {
  id        String   @id @default(uuid())
  buyerId   String
  buyer     Buyer    @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  changedBy String?
  changedAt DateTime @default(now())
  diff      Json
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables (Production)
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### Database Migration (Production)
```bash
npx prisma migrate deploy
```

## 📈 Performance Optimizations

### React Optimizations
- `React.memo` for component memoization
- `useCallback` for function memoization
- `useMemo` for expensive calculations
- Optimized re-render cycles

### API Optimizations
- Efficient database queries with Prisma
- Pagination for large datasets
- Rate limiting for resource protection
- Connection pooling

### Frontend Optimizations
- Code splitting with Next.js
- Image optimization
- CSS optimization with Tailwind
- Bundle size optimization

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma studio       # Open database GUI
npx prisma migrate dev  # Create migration
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Reset database
npx prisma migrate reset
npx prisma migrate dev
```

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Type Errors**
```bash
# Regenerate Prisma client
npx prisma generate
```

### Getting Help

- Check the [Issues](../../issues) page
- Review the [Documentation](./docs/)
- Contact the development team

---

**Built with ❤️ using Next.js, TypeScript, and Prisma**