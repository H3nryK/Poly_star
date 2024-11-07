import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

// Enhanced Data Models
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
    type: 'sale' | 'purchase' | 'expense' | 'investment';
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
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
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

    // Add a validation middleware
    const validateInventory = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const { quantity, minimumThreshold, cost } = req.body;
        if (quantity < 0 || minimumThreshold < 0 || cost < 0) {
            return res.status(400).json({ error: "Invalid numeric values" });
        }
        next();
    };

    // Add auth middleware
    const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const caller = ic.caller();
        if (!caller) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.body.ownerId = caller.toString();
        next();
    };

    // Add simple caching mechanism
    const cache = new Map<string, {data: any, timestamp: number}>();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    function getCachedData(key: string) {
        const cached = cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    // Inventory Management Routes
    app.post("/inventory", async (req, res) => {
        try {
            const inventory: Inventory = {
                id: uuidv4(),
                createdAt: getCurrentDate(),
                updatedAt: null,
                ...req.body
            };
            await inventoryStorage.insert(inventory.id, inventory);
            res.json(inventory);
        } catch (error) {
            res.status(500).json({ error: "Failed to create inventory" });
        }
    });

    app.get("/farms/:farmId/inventory", (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        const allInventory = inventoryStorage.values();
        const farmInventory = allInventory
            .filter(inv => inv.farmId === req.params.farmId)
            .slice(skip, skip + Number(limit));
        
        res.json({
            data: farmInventory,
            page: Number(page),
            total: allInventory.length
        });
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
        transactionsStorage.insert(transaction.id, transaction);
        res.json(transaction);
    });

    app.get("/farms/:farmId/financial-report", (req, res) => {
        const cacheKey = `financial-report-${req.params.farmId}`;
        const cached = getCachedData(cacheKey);
        if (cached) return res.json(cached);
        
        const farmId = req.params.farmId;
        const { startDate, endDate } = req.query;
        const transactions = transactionsStorage.values()
            .filter(tx => tx.farmId === farmId);
        
        const report = {
            totalSales: calculateTotal(transactions, 'sale'),
            totalExpenses: calculateTotal(transactions, 'expense'),
            totalInvestments: calculateTotal(transactions, 'investment'),
            netProfit: calculateTotal(transactions, 'sale') - calculateTotal(transactions, 'expense'),
            transactionsByCategory: groupTransactionsByCategory(transactions)
        };
        cache.set(cacheKey, {data: report, timestamp: Date.now()});
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
            status: 'pending',
            paymentStatus: 'pending',
            ...req.body
        };
        
        // Update product availability
        order.products.forEach(item => {
            const productOpt = productsStorage.get(item.productId);
            if ("Some" in productOpt) {
                const product = productOpt.Some;
                if (product) {
                    product.quantity -= item.quantity;
                    product.available = product.quantity > 0;
                    productsStorage.insert(product.id, product);
                }
            }
        });
        
        ordersStorage.insert(order.id, order);
        res.json(order);
    });

    // Helper functions
    function calculateTotal(transactions: Transaction[], type: string): number {
        return transactions
            .filter(tx => tx.type === type)
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    function groupTransactionsByCategory(transactions: Transaction[]) {
        return transactions.reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
            return acc;
        }, {} as Record<string, number>);
    }

    function calculateMetrics(birds: Bird[], transactions: Transaction[]) {
        if (!birds.length) {
            return {
                mortality_rate: 0,
                feed_conversion_ratio: 0,
                production_rate: 0,
                revenue: 0,
                expenses: 0,
                profit_margin: 0
            };
        }
        const totalBirds = birds.reduce((sum, b) => sum + b.quantity, 0);
        const deadBirds = birds.filter(b => b.status === 'deceased')
            .reduce((sum, b) => sum + b.quantity, 0);
        
        return {
            mortality_rate: (deadBirds / totalBirds) * 100,
            feed_conversion_ratio: calculateFCR(birds),
            production_rate: calculateProductionRate(birds),
            revenue: calculateTotal(transactions, 'sale'),
            expenses: calculateTotal(transactions, 'expense'),
            profit_margin: calculateProfitMargin(transactions)
        };
    }

    function calculateFCR(birds: Bird[]): number {
        const totalFeed = birds.reduce((sum, b) => sum + b.feedConsumption, 0);
        const totalWeight = birds.reduce((sum, b) => sum + b.weight * b.quantity, 0);
        return totalFeed / totalWeight;
    }

    function calculateProductionRate(birds: Bird[]): number {
        // Implementation depends on specific production metrics
        return 0;
    }

    function calculateProfitMargin(transactions: Transaction[]): number {
        const revenue = calculateTotal(transactions, 'sale');
        const expenses = calculateTotal(transactions, 'expense');
        if (revenue === 0) return 0;
        return ((revenue - expenses) / revenue) * 100;
    }

    return app.listen();
});

function getCurrentDate(): Date {
    const timestamp = Number(ic.time());
    if (isNaN(timestamp)) {
        throw new Error("Invalid timestamp");
    }
    return new Date(Math.floor(timestamp / 1_000_000));
}