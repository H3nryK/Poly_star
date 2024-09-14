import { 
    query, 
    update, 
    Canister,
    text,
    Record, 
    Vec, 
    Result, 
    nat64, 
    ic, 
    bool,
    StableBTreeMap
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the Chicken type
const Chicken = Record({
    id: text,
    breed: text,
    age: nat64,
    weight: nat64,
    eggProduction: nat64,
    vaccinationStatus: bool,
    lastHealthCheck: nat64
});

// Define the Feed type
const Feed = Record({
    id: text,
    name: text,
    quantity: nat64,
    purchaseDate: nat64,
    expiryDate: nat64
});

// Use let for mutable variables
let chickenStorage = StableBTreeMap<text, typeof Chicken>(0);
let feedStorage = StableBTreeMap<text, typeof Feed>(1);

export default Canister({
    // CRUD operations for Chicken

    getChicken: query([text], Result(Chicken, text), (id) => {
        const chickenOpt = chickenStorage.get(id);
        if ("None" in chickenOpt) {
            return Result.Err(`Chicken with id=${id} not found`);
        }
        return Result.Ok(chickenOpt.Some);
    }),

    getAllChickens: query([], Vec(Chicken), () => {
        return chickenStorage.values();
    }),

    createChicken: update([text, nat64, nat64, nat64], Result(Chicken, text), (breed, age, weight, eggProduction) => {
        const chicken: typeof Chicken = {
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
    }),

    updateChicken: update([text, text, nat64, nat64, nat64, bool], Result(Chicken, text), (id, breed, age, weight, eggProduction, vaccinationStatus) => {
        const chickenOpt = chickenStorage.get(id);
        if ("None" in chickenOpt) {
            return Result.Err(`Chicken with id=${id} not found`);
        }
        const updatedChicken: typeof Chicken = {
            ...chickenOpt.Some,
            breed,
            age,
            weight,
            eggProduction,
            vaccinationStatus,
            lastHealthCheck: ic.time()
        };
        chickenStorage.insert(id, updatedChicken);
        return Result.Ok(updatedChicken);
    }),

    deleteChicken: update([text], Result(Chicken, text), (id) => {
        const chickenOpt = chickenStorage.remove(id);
        if ("None" in chickenOpt) {
            return Result.Err(`Chicken with id=${id} not found`);
        }
        return Result.Ok(chickenOpt.Some);
    }),

    // CRUD operations for Feed

    getFeed: query([text], Result(Feed, text), (id) => {
        const feedOpt = feedStorage.get(id);
        if ("None" in feedOpt) {
            return Result.Err(`Feed with id=${id} not found`);
        }
        return Result.Ok(feedOpt.Some);
    }),

    getAllFeeds: query([], Vec(Feed), () => {
        return feedStorage.values();
    }),

    createFeed: update([text, nat64, nat64], Result(Feed, text), (name, quantity, expiryDate) => {
        const feed: typeof Feed = {
            id: uuidv4(),
            name,
            quantity,
            purchaseDate: ic.time(),
            expiryDate
        };
        feedStorage.insert(feed.id, feed);
        return Result.Ok(feed);
    }),

    updateFeed: update([text, text, nat64, nat64], Result(Feed, text), (id, name, quantity, expiryDate) => {
        const feedOpt = feedStorage.get(id);
        if ("None" in feedOpt) {
            return Result.Err(`Feed with id=${id} not found`);
        }
        const updatedFeed: typeof Feed = {
            ...feedOpt.Some,
            name,
            quantity,
            expiryDate
        };
        feedStorage.insert(id, updatedFeed);
        return Result.Ok(updatedFeed);
    }),

    deleteFeed: update([text], Result(Feed, text), (id) => {
        const feedOpt = feedStorage.remove(id);
        if ("None" in feedOpt) {
            return Result.Err(`Feed with id=${id} not found`);
        }
        return Result.Ok(feedOpt.Some);
    }),

    // Additional features for Kenyan market

    getChickensByBreed: query([text], Vec(Chicken), (breed) => {
        return chickenStorage.values().filter(chicken => chicken.breed === breed);
    }),

    getTotalEggProduction: query([], nat64, () => {
        return chickenStorage.values().reduce((sum, chicken) => sum + chicken.eggProduction, 0n);
    }),

    recordVaccination: update([text], Result(Chicken, text), (chickenId) => {
        const chickenOpt = chickenStorage.get(chickenId);
        if ("None" in chickenOpt) {
            return Result.Err(`Chicken with id=${chickenId} not found`);
        }
        const updatedChicken: typeof Chicken = {
            ...chickenOpt.Some,
            vaccinationStatus: true,
            lastHealthCheck: ic.time()
        };
        chickenStorage.insert(chickenId, updatedChicken);
        return Result.Ok(updatedChicken);
    }),

    getLowStockFeeds: query([nat64], Vec(Feed), (threshold) => {
        return feedStorage.values().filter(feed => feed.quantity < threshold);
    }),

    // Placeholder for a more complex function that could integrate with local weather data
    getWeatherBasedRecommendations: query([], text, () => {
        return "Feature not yet implemented. This function will provide recommendations based on local weather conditions.";
    })
});