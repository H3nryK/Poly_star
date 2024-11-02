# 🐔 Poultry Farm Management System

A comprehensive digital solution for managing poultry farms, connecting with the community, and streamlining market access. Built using TypeScript and running on the Internet Computer platform.

## 🌟 Features

### Farm Management
- Multiple farm registration and management
- Capacity and stock monitoring
- Employee tracking
- Certification management

### Bird Management
- Track different breeds and batches
- Health status monitoring
- Vaccination scheduling
- Weight and feed consumption tracking
- Mortality rate calculation

### Inventory Control
- 📦 Track feed, medicine, equipment, and supplies
- Automatic low-stock alerts
- Expiry date monitoring
- Supplier management
- Cost tracking

### Financial Management
- 💰 Transaction tracking (sales, purchases, expenses)
- Financial reporting and analytics
- Profit margin calculations
- Payment processing
- Investment tracking

### Health Monitoring
- 🏥 Vaccination records
- Disease outbreak tracking
- Treatment management
- Follow-up scheduling
- Health reports generation

### Market Integration
- 🏪 Product listing and management
- Order processing
- Delivery tracking
- Customer management
- Quality grading system

### Analytics & Reporting
- 📊 Key Performance Indicators (KPIs)
- Feed conversion ratio calculations
- Production rate monitoring
- Financial analysis
- Health statistics

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- DFX (Internet Computer SDK)
- TypeScript
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/h3nryk/poly_star.git
cd poly_star
```

2. Install dependencies
```bash
npm install
```

3. Deploy locally
```bash
dfx start --clean --background
dfx deploy
```

## 🔗 API Endpoints

### Farm Management
```
POST /farms - Create new farm
GET /farms - List all farms
GET /farms/:id - Get specific farm details
```

### Bird Management
```
POST /birds - Add new birds
GET /farms/:farmId/birds - List farm birds
PUT /birds/:id - Update bird information
```

### Inventory Management
```
POST /inventory - Add inventory items
GET /farms/:farmId/inventory - List farm inventory
POST /inventory/alert-threshold - Check low stock items
```

### Financial Management
```
POST /transactions - Record transaction
GET /farms/:farmId/financial-report - Generate financial report
```

### Health Records
```
POST /health-records - Add health record
GET /farms/:farmId/health-report - Generate health report
```

### Analytics
```
POST /analytics/generate - Generate farm analytics
GET /farms/:farmId/analytics - Get farm analytics
```

### Order Management
```
POST /orders - Create new order
GET /orders/:farmId - List farm orders
PUT /orders/:id - Update order status
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ for the poultry farming community