import { 
    query, 
    update, 
    Canister,
    text,
    Record, 
    StableBTreeMap, 
    Vec, 
    Result, 
    nat64, 
    ic, 
    Opt,
    None,
    Some,
    bool
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

// Define storage for chickens and feed
const chickenStorage = new StableBTreeMap<text, typeof Chicken>(0, 44, 1024);
const feedStorage = new StableBTreeMap<text, typeof Feed>(1, 44, 1024);

export default Canister({
    // CRUD operations for Chicken

    getChicken: query([text], Result(Chicken, text), (id) => {
        const chickenOpt = chickenStorage.get(id);
        return chickenOpt.match({
            Some: (chicken) => Result.Ok(chicken),
            None: () => Result.Err(`Chicken with id=${id} not found`)
        });
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
        return chickenStorage.get(id).match({
            Some: (existingChicken) => {
                const updatedChicken: typeof Chicken = {
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
        return chickenStorage.remove(id).match({
            Some: (deletedChicken) => Result.Ok(deletedChicken),
            None: () => Result.Err(`Chicken with id=${id} not found`)
        });
    }),

    // CRUD operations for Feed

    getFeed: query([text], Result(Feed, text), (id) => {
        return feedStorage.get(id).match({
            Some: (feed) => Result.Ok(feed),
            None: () => Result.Err(`Feed with id=${id} not found`)
        });
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
        return feedStorage.get(id).match({
            Some: (existingFeed) => {
                const updatedFeed: typeof Feed = {
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
        return feedStorage.remove(id).match({
            Some: (deletedFeed) => Result.Ok(deletedFeed),
            None: () => Result.Err(`Feed with id=${id} not found`)
        });
    }),

    // Additional features for Kenyan market

    getChickensByBreed: query([text], Vec(Chicken), (breed) => {
        return chickenStorage.values().filter(chicken => chicken.breed === breed);
    }),

    getTotalEggProduction: query([], nat64, () => {
        return chickenStorage.values().reduce((sum, chicken) => sum + chicken.eggProduction, 0n);
    }),

    recordVaccination: update([text], Result(Chicken, text), (chickenId) => {
        return chickenStorage.get(chickenId).match({
            Some: (chicken) => {
                const updatedChicken: typeof Chicken = {
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

    // Placeholder for a more complex function that could integrate with local weather data
    getWeatherBasedRecommendations: query([], text, () => {
        return "Feature not yet implemented. This function will provide recommendations based on local weather conditions.";
    })
});