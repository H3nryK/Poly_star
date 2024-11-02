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

// Define the Record types
const Chicken = Record({
    id: text,
    breed: text,
    age: nat64,
    weight: nat64,
    eggProduction: nat64,
    vaccinationStatus: bool,
    lastHealthCheck: nat64
});

const Feed = Record({
    id: text,
    name: text,
    quantity: nat64,
    purchaseDate: nat64,
    expiryDate: nat64
});

// Initialize storage
const chickenStorage = new StableBTreeMap<string, typeof Chicken>(0);
const feedStorage = new StableBTreeMap<string, typeof Feed>(1);

export default Canister({
    // Chicken Management
    getChicken: query([text], Result(Chicken, text), (id) => {
        const chicken = chickenStorage.get(id);
        return chicken.match({
            Some: (chicken) => Result.Ok(chicken),
            None: () => Result.Err(`Chicken with id=${id} not found`)
        });
    }),

    getAllChickens: query([], Vec(Chicken), () => {
        return chickenStorage.values();
    }),

    createChicken: update([text, nat64, nat64, nat64], Result(Chicken, text), (breed, age, weight, eggProduction) => {
        const chicken = {
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
        return chickenStorage.get(id).match({
            Some: (existingChicken) => {
                const updatedChicken = {
                    ...existingChicken,
                    breed,
                    age,
                    weight,
                    eggProduction,
                    vaccinationStatus,
                    lastHealthCheck: ic.time()
                };
                chickenStorage.insert(id, updatedChicken);
                return Result.Ok(updatedChicken);
            },
            None: () => Result.Err(`Chicken with id=${id} not found`)
        });
    }),

    deleteChicken: update([text], Result(Chicken, text), (id) => {
        return chickenStorage.get(id).match({
            Some: (chicken) => {
                chickenStorage.remove(id);
                return Result.Ok(chicken);
            },
            None: () => Result.Err(`Chicken with id=${id} not found`)
        });
    }),

    // Feed Management
    getFeed: query([text], Result(Feed, text), (id) => {
        const feed = feedStorage.get(id);
        return feed.match({
            Some: (feed) => Result.Ok(feed),
            None: () => Result.Err(`Feed with id=${id} not found`)
        });
    }),

    getAllFeeds: query([], Vec(Feed), () => {
        return feedStorage.values();
    }),

    createFeed: update([text, nat64, nat64], Result(Feed, text), (name, quantity, expiryDate) => {
        const feed = {
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
        return feedStorage.get(id).match({
            Some: (existingFeed) => {
                const updatedFeed = {
                    ...existingFeed,
                    name,
                    quantity,
                    expiryDate
                };
                feedStorage.insert(id, updatedFeed);
                return Result.Ok(updatedFeed);
            },
            None: () => Result.Err(`Feed with id=${id} not found`)
        });
    }),

    deleteFeed: update([text], Result(Feed, text), (id) => {
        return feedStorage.get(id).match({
            Some: (feed) => {
                feedStorage.remove(id);
                return Result.Ok(feed);
            },
            None: () => Result.Err(`Feed with id=${id} not found`)
        });
    }),

    // Additional Features
    getChickensByBreed: query([text], Vec(Chicken), (breed) => {
        return chickenStorage.values().filter(chicken => chicken.breed === breed);
    }),

    getTotalEggProduction: query([], nat64, () => {
        return chickenStorage.values().reduce((sum, chicken) => sum + chicken.eggProduction, 0n);
    }),

    recordVaccination: update([text], Result(Chicken, text), (chickenId) => {
        return chickenStorage.get(chickenId).match({
            Some: (chicken) => {
                const updatedChicken = {
                    ...chicken,
                    vaccinationStatus: true,
                    lastHealthCheck: ic.time()
                };
                chickenStorage.insert(chickenId, updatedChicken);
                return Result.Ok(updatedChicken);
            },
            None: () => Result.Err(`Chicken with id=${chickenId} not found`)
        });
    }),

    getLowStockFeeds: query([nat64], Vec(Feed), (threshold) => {
        return feedStorage.values().filter(feed => feed.quantity < threshold);
    }),

    getWeatherBasedRecommendations: query([], text, () => {
        return "Feature not yet implemented. This function will provide recommendations based on local weather conditions.";
    })
});