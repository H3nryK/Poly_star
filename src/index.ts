import { 
    query, 
    update, 
    Record, 
    StableBTreeMap, 
    Vec, 
    Result, 
    nat64, 
    ic, 
    Opt 
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the Chicken type
type Chicken = Record<{
    id: string;
    breed: string;
    age: nat64;
    weight: number;
    eggProduction: nat64;
    vaccinationStatus: boolean;
    lastHealthCheck: nat64;
}>;

// Define the Feed type
type Feed = Record<{
    id: string;
    name: string;
    quantity: number;
    purchaseDate: nat64;
    expiryDate: nat64;
}>;

// Define storage for chickens and feed
const chickenStorage = new StableBTreeMap<string, Chicken>(0, 44, 1024);
const feedStorage = new StableBTreeMap<string, Feed>(1, 44, 1024);

// CRUD operations for Chicken

export const getChicken = query((id: string): Result<Chicken, string> => {
    const chickenOpt = chickenStorage.get(id);
    if ("None" in chickenOpt) {
        return Result.Err<Chicken, string>(`Chicken with id=${id} not found`);
    }
    return Result.Ok<Chicken, string>(chickenOpt.Some);
});

export const getAllChickens = query((): Result<Vec<Chicken>, string> => {
    return Result.Ok(chickenStorage.values());
});

export const createChicken = update((breed: string, age: nat64, weight: number, eggProduction: nat64): Result<Chicken, string> => {
    const chicken: Chicken = {
        id: uuidv4(),
        breed,
        age,
        weight,
        eggProduction,
        vaccinationStatus: false,
        lastHealthCheck: ic.time()
    };
    chickenStorage.insert(chicken.id, chicken);
    return Result.Ok(chicken);
});

export const updateChicken = update((id: string, breed: string, age: nat64, weight: number, eggProduction: nat64, vaccinationStatus: boolean): Result<Chicken, string> => {
    const existingChickenOpt = chickenStorage.get(id);
    if ("None" in existingChickenOpt) {
        return Result.Err<Chicken, string>(`Chicken with id=${id} not found`);
    }
    const updatedChicken: Chicken = {
        ...existingChickenOpt.Some,
        breed,
        age,
        weight,
        eggProduction,
        vaccinationStatus,
        lastHealthCheck: ic.time()
    };
    chickenStorage.insert(id, updatedChicken);
    return Result.Ok<Chicken, string>(updatedChicken);
});

export const deleteChicken = update((id: string): Result<Chicken, string> => {
    const deletedChickenOpt = chickenStorage.remove(id);
    if ("None" in deletedChickenOpt) {
        return Result.Err<Chicken, string>(`Chicken with id=${id} not found`);
    }
    return Result.Ok<Chicken, string>(deletedChickenOpt.Some);
});

// CRUD operations for Feed

export const getFeed = query((id: string): Result<Feed, string> => {
    const feedOpt = feedStorage.get(id);
    if ("None" in feedOpt) {
        return Result.Err<Feed, string>(`Feed with id=${id} not found`);
    }
    return Result.Ok<Feed, string>(feedOpt.Some);
});

export const getAllFeeds = query((): Result<Vec<Feed>, string> => {
    return Result.Ok(feedStorage.values());
});

export const createFeed = update((name: string, quantity: number, expiryDate: nat64): Result<Feed, string> => {
    const feed: Feed = {
        id: uuidv4(),
        name,
        quantity,
        purchaseDate: ic.time(),
        expiryDate
    };
    feedStorage.insert(feed.id, feed);
    return Result.Ok(feed);
});

export const updateFeed = update((id: string, name: string, quantity: number, expiryDate: nat64): Result<Feed, string> => {
    const existingFeedOpt = feedStorage.get(id);
    if ("None" in existingFeedOpt) {
        return Result.Err<Feed, string>(`Feed with id=${id} not found`);
    }
    const updatedFeed: Feed = {
        ...existingFeedOpt.Some,
        name,
        quantity,
        expiryDate
    };
    feedStorage.insert(id, updatedFeed);
    return Result.Ok<Feed, string>(updatedFeed);
});

export const deleteFeed = update((id: string): Result<Feed, string> => {
    const deletedFeedOpt = feedStorage.remove(id);
    if ("None" in deletedFeedOpt) {
        return Result.Err<Feed, string>(`Feed with id=${id} not found`);
    }
    return Result.Ok<Feed, string>(deletedFeedOpt.Some);
});

// Additional features for Kenyan market

export const getChickensByBreed = query((breed: string): Result<Vec<Chicken>, string> => {
    const chickens = chickenStorage.values().filter(chicken => chicken.breed === breed);
    return Result.Ok(chickens);
});

export const getTotalEggProduction = query((): Result<nat64, string> => {
    const totalEggs = chickenStorage.values().reduce((sum, chicken) => sum + chicken.eggProduction, 0n);
    return Result.Ok(totalEggs);
});

export const recordVaccination = update((chickenId: string): Result<Chicken, string> => {
    const chickenOpt = chickenStorage.get(chickenId);
    if ("None" in chickenOpt) {
        return Result.Err<Chicken, string>(`Chicken with id=${chickenId} not found`);
    }
    const updatedChicken: Chicken = {
        ...chickenOpt.Some,
        vaccinationStatus: true,
        lastHealthCheck: ic.time()
    };
    chickenStorage.insert(chickenId, updatedChicken);
    return Result.Ok<Chicken, string>(updatedChicken);
});

export const getLowStockFeeds = query((threshold: number): Result<Vec<Feed>, string> => {
    const lowStockFeeds = feedStorage.values().filter(feed => feed.quantity < threshold);
    return Result.Ok(lowStockFeeds);
});

// Placeholder for a more complex function that could integrate with local weather data
export const getWeatherBasedRecommendations = query((): string => {
    return "Feature not yet implemented. This function will provide recommendations based on local weather conditions.";
});