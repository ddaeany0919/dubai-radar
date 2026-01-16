
import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

export async function GET(request: NextRequest) {
    let clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // For local development, try to get the public IP
    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            clientIp = ipData.ip;
        } catch (e) {
            console.error('Failed to get public IP:', e);
        }
    }

    const accessKey = process.env.NAVER_CLIENT_ID;
    const secretKey = process.env.NAVER_CLIENT_SECRET;

    if (!accessKey || !secretKey) {
        return NextResponse.json({ error: 'NCP credentials missing.' }, { status: 200 });
    }

    try {
        const timestamp = Date.now().toString();
        const method = 'GET';
        const space = " ";
        const newLine = "\n";
        const uri = `/geolocation/v2/geoLocation?ip=${clientIp}&ext=t&enc=utf8`;

        // Generate NCP Signature
        const message = method + space + uri + newLine + timestamp + newLine + accessKey;
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(message)
            .digest('base64');

        const url = `https://geolocation.apigw.ntruss.com${uri}`;

        const response = await fetch(url, {
            headers: {
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': accessKey,
                'x-ncp-apigw-signature-v2': signature,
            },
        });

        const data = await response.json();

        if (data.geoLocation) {
            return NextResponse.json({
                lat: data.geoLocation.lat,
                lng: data.geoLocation.long,
                address: `${data.geoLocation.addr1} ${data.geoLocation.addr2} ${data.geoLocation.addr3}`,
                provider: 'naver'
            });
        }

        return NextResponse.json({
            error: 'Naver API Response Error',
            details: data,
            ip: clientIp
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'System Error', message: error.message }, { status: 200 });
    }
}
