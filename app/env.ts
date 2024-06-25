import dotenv from 'dotenv';

dotenv.config();

export function getenv(name: string): string | undefined {
    return process.env[name];
}
