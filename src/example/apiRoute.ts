import { NextResponse } from 'next/server';
import loadBalancer from '@/lib/loadBalancer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const body = await req.json();
    
    // Configurable endpoint
    const API_ENDPOINT = 'https://api.example.com/v1/resource'; 
    const MAX_RETRIES = Math.max(loadBalancer.totalProxies, loadBalancer.totalKeys, 15);
    
    let response;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const { apiKey, proxyUrl, dispatcher } = loadBalancer.getNextConnection();

        if (!apiKey) {
            return NextResponse.json({ error: 'No Available Keys' }, { status: 500 });
        }

        try {
            response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                ...(dispatcher ? { dispatcher } : {})
            } as any);

            if (response.ok) break;

            if (response.status === 429) {
                loadBalancer.flagKey(apiKey);
            } else if ([503, 504, 502, 403].includes(response.status)) {
                if (proxyUrl) loadBalancer.flagProxy(proxyUrl);
            }
            
            if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 403) {
                return NextResponse.json({ error: 'Bad Request' }, { status: response.status });
            }

        } catch (error: any) {
            if (proxyUrl) loadBalancer.flagProxy(proxyUrl);
        }
    }

    if (!response || !response.ok) {
         return NextResponse.json({ error: 'Max retries reached.' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
}
