import { Provider } from "@nestjs/common";
import { createRedisClient } from "../../db/redis.js";

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: async () => {
        return await createRedisClient();
    }
}