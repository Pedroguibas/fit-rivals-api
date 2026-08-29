import { createClient } from 'redis';
import checkEnvVaribale from '../helpers/check-env-variables.js';


export const createRedisClient = async () => {

    const client = createClient({
        username: checkEnvVaribale('REDIS_USERNAME'),
        password: checkEnvVaribale('REDIS_PASSWORD'),
        socket: {
            host: checkEnvVaribale('REDIS_HOST'),
            port: checkEnvVaribale<number>('REDIS_PORT')
        }
    });
    
    client.on('error', err => console.log('Redis Client Error', err));
    
    await client.connect();
    
    return client;
}

