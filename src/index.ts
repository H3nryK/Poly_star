import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

// Enums for Status Fields
enum OrderStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Shipped = 'shipped',
    Delivered = 'delivered',
    Cancelled = 'cancelled'
}

enum PaymentStatus {
    Pending = 'pending',
    Paid = 'paid',
    Refunded = 'refunded'
}

enum TransactionType {
    Sale = 'sale',
    Purchase = 'purchase',
    Expense = 'expense',
    Investment = 'investment'
}

class Farm {
    id: string;
    ownerId: string;
    name: string;
    location: string;
    capacity: number;
    currentStock: number;
    description: string;
    licenseNumber: string;
    certifications: string[];
    employeeCount: number;
    createdAt: Date;
    updatedAt: Date | null;
}

class Bird {
    id: string;
    farmId: string;
    breed: string;
    quantity: number;
    age: number;
    status: 'healthy' | 'sick' | 'sold' | 'deceased';
    lastVaccinated: Date | null;
    weight: number;
    feedConsumption: number;
    batchNumber: string;
    createdAt: Date;
    updatedAt: Date | null;
}

class Inventory {
    id: string;
    farmId: string;
    type: 'feed' | 'medicine' | 'equipment' | 'supplies';
    name: string;
    quantity: number;
    unit: string;
    minimumThreshold: number;
    cost: number;
    supplier: string;
    expiryDate?: Date;
    createdAt: Date;
    updatedAt: Date | null;
}

class Product {
    id: string;
    farmId: string;
    name: string;
    type: 'eggs' | 'meat' | 'chicks' | 'manure';
    quantity: number;
    price: number;
    available: boolean;
    quality: 'premium' | 'standard' | 'economy';
    productionDate: Date;
    expiryDate?: Date;
    batchNumber: string;
    createdAt: Date;
    updatedAt: Date | null;
}

class Transaction {
    id: string;
    farmId: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    paymentMethod: string;
    status: 'pending' | 'completed' | 'cancelled';
    relatedId?: string; // Reference to product/inventory/other entity
    createdAt: Date;
    updatedAt: Date | null;
}

class HealthRecord {
    id: string;
    farmId: string;
    batchNumber: string;
    type: 'vaccination' | 'medication' | 'inspection' | 'disease';
    description: string;
    affectedCount: number;
    treatment?: string;
    cost: number;
    performedBy: string;
    nextFollowUp?: Date;
    createdAt: Date;
    updatedAt: Date | null;
}

class Analytics {
    id: string;
    farmId: string;
    period: 'daily' | 'weekly' | 'monthly';
    metrics: {
        mortality_rate: number;
        feed_conversion_ratio: number;
        production_rate: number;
        revenue: number;
        expenses: number;
        profit_margin: number;
    };
    createdAt: Date;
}

class Order {
    id: string;
    farmId: string;
    customerId: string;
    products: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    deliveryAddress?: string;
    deliveryDate?: Date;
    createdAt: Date;
    updatedAt: Date | null;
}

// Storage
const farmsStorage = StableBTreeMap<string, Farm>(0);
const birdsStorage = StableBTreeMap<string, Bird>(1);
const productsStorage = StableBTreeMap<string, Product>(2);
const inventoryStorage = StableBTreeMap<string, Inventory>(3);
const transactionsStorage = StableBTreeMap<string, Transaction>(4);
const healthRecordsStorage = StableBTreeMap<string, HealthRecord>(5);
const analyticsStorage = StableBTreeMap<string, Analytics>(6);
const ordersStorage = StableBTreeMap<string, Order>(7);

export default Server(() => {
    const app = express();
    app.use(express.json());

    // Inventory Management Routes
    app.post("/inventory", (req, res) => {
        const inventory: Inventory = {
            id: uuidv4(),
            createdAt: getCurrentDate(),
            updatedAt: null,
            ...req.body
        };
        inventoryStorage.insert(inventory.id, inventory);
        res.json(inventory);
    });

    app.get("/farms/:farmId/inventory", (req, res) => {
        const farmId = req.params.farmId;
        const allInventory = inventoryStorage.values();
        const farmInventory = allInventory.filter(inv => inv.farmId === farmId);
        res.json(farmInventory);
    });

    app.post("/inventory/alert-threshold", (req, res) => {
        const farmId = req.body.farmId;
        const allInventory = inventoryStorage.values();
        const lowStock = allInventory
            .filter(inv => inv.farmId === farmId && inv.quantity <= inv.minimumThreshold);
        res.json(lowStock);
    });

    // Financial Management Routes
    app.post("/transactions", (req, res) => {
        const transaction: Transaction = {
            id: uuidv4(),
            createdAt: getCurrentDate(),
            updatedAt: null,
            ...req.body
        };

        // Validate input before processing
        try {
            validateTransactionInput(transaction);
            transactionsStorage.insert(transaction.id, transaction);
            res.json(transaction);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.get("/farms/:farmId/financial-report", (req, res) => {
        const farmId = req.params.farmId;
        const { startDate, endDate } = req.query;
        const transactions = transactionsStorage.values()
            .filter(tx => tx.farmId === farmId);
        
        const report = {
            totalSales: calculateTotal(transactions, TransactionType.Sale),
            totalExpenses: calculateTotal(transactions, TransactionType.Expense),
            totalInvestments: calculateTotal(transactions, TransactionType.Investment),
            netProfit: calculateTotal(transactions, TransactionType.Sale) - calculateTotal(transactions, TransactionType.Expense),
            transactionsByCategory: groupTransactionsByCategory(transactions)
        };
        res.json(report);
    });

    // Health Management Routes
    app.post("/health-records", (req, res) => {
        const record: HealthRecord = {
            id: uuidv4(),
            createdAt: getCurrentDate(),
            updatedAt: null,
            ...req.body
        };
        healthRecordsStorage.insert(record.id, record);
        res.json(record);
    });

    app.get("/farms/:farmId/health-report", (req, res) => {
        const farmId = req.params.farmId;
        const records = healthRecordsStorage.values()
            .filter(record => record.farmId === farmId);
        
        const report = {
            totalVaccinations: records.filter(r => r.type === 'vaccination').length,
            activeDiseases: records.filter(r => r.type === 'disease' && !r.treatment),
            upcomingFollowUps: records.filter(r => r.nextFollowUp && r.nextFollowUp > getCurrentDate())
        };
        res.json(report);
    });

    // Analytics Routes
    app.post("/analytics/generate", (req, res) => {
        const farmId = req.params.farmId;
        const birds = birdsStorage.values().filter(b => b.farmId === farmId);
        const transactions = transactionsStorage.values().filter(t => t.farmId === farmId);
        
        const analytics: Analytics = {
            id: uuidv4(),
            farmId,
            period: 'monthly',
            metrics: calculateMetrics(birds, transactions),
            createdAt: getCurrentDate()
        };
        
        analyticsStorage.insert(analytics.id, analytics);
        res.json(analytics);
    });

    // Order Management Routes
    app.post("/orders", (req, res) => {
        const order: Order = {
            id: uuidv4(),
            createdAt: getCurrentDate(),
            updatedAt: null,
            status: OrderStatus.Pending,
            paymentStatus: PaymentStatus.Pending,
            ...req.body
        };
        
        // Update product availability
        order.products.forEach(item => {
            const productOpt = productsStorage.get(item.productId);
            if ("Some" in productOpt) {
                const product = productOpt.Some;
                product.quantity -= item.quantity;
                product.available = product.quantity > 0;
                productsStorage.insert(product.id, product);
            } else {
                return res.status(404).json({ error: "Product not found" });
            }
        });

        ordersStorage.insert(order.id, order);
        res.json(order);
    });

    return app;
});

// Helper Functions
function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1_000_000); // Fixed timestamp conversion
}

function validateTransactionInput(tx: Transaction) {
    if (tx.amount <= 0 || !Object.values(TransactionType).includes(tx.type)) {
        throw new Error("Invalid transaction input");
    }
}

function calculateTotal(transactions: Transaction[], type: TransactionType): number {
    return transactions
        .filter(tx => tx.type === type)
        .reduce((sum, tx) => sum + tx.amount, 0);
}

function calculateMetrics(birds: Bird[], transactions: Transaction[]) {
    const totalBirds = birds.reduce((sum, b) => sum + b.quantity, 0);
    const deadBirds = birds.filter(b => b.status === 'deceased').reduce((sum, b) => sum + b.quantity, 0);
    return {
        mortality_rate: (deadBirds / totalBirds) * 100,
        feed_conversion_ratio: calculateFCR(birds),
        production_rate: calculateProductionRate(birds),
        revenue: calculateTotal(transactions, TransactionType.Sale),
        expenses: calculateTotal(transactions, TransactionType.Expense),
        profit_margin: calculateProfitMargin(transactions)
    };
}

function groupTransactionsByCategory(transactions: Transaction[]) {
    return transactions.reduce((acc, tx) => {
        if (!acc[tx.category]) {
            acc[tx.category] = [];
        }
        acc[tx.category].push(tx);
        return acc;
    }, {});
}
