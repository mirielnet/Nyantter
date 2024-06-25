import axios from 'axios';
import { getenv } from './env';

export async function verifyCaptcha(token: string): Promise<boolean> {
    const data = {
        secret: getenv('turnstile_secret'),
        response: token
    };

    try {
        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', data);
        return response.data.success;
    } catch (error) {
        console.error('Error verifying captcha:', error);
        return false;
    }
}
