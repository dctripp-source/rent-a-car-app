import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function verifyToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found');
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken.uid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in verifyToken:', error);
    return null;
  }
}