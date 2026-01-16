
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMore() {
    console.log("Seeding more data...");

    const stores = [
        { name: '강남 초코하우스', address: '서울특별시 강남구 테헤란로 123', lat: 37.4979, lng: 127.0276, is_open: true },
        { name: '홍대 쿠키팩토리', address: '서울특별시 마포구 어울마당로 45', lat: 37.5512, lng: 126.9227, is_open: true },
        { name: '신사 디저트랩', address: '서울특별시 강남구 도산대로 13길 10', lat: 37.5219, lng: 127.0228, is_open: true },
        { name: '연남동 초코빌리지', address: '서울특별시 마포구 동교로 242', lat: 37.5612, lng: 126.9245, is_open: true },
        { name: '역삼 스위트홈', address: '서울특별시 강남구 논현로 85길 5', lat: 37.5006, lng: 127.0365, is_open: true }
    ];

    for (const store of stores) {
        let storeId;
        const { data: existingStore } = await supabase.from('stores').select('id').eq('name', store.name).maybeSingle();

        if (existingStore) {
            storeId = existingStore.id;
            await supabase.from('stores').update(store).eq('id', storeId);
        } else {
            const { data: newStore, error } = await supabase.from('stores').insert(store).select();
            if (error) {
                console.error(`Error inserting store ${store.name}:`, error);
                continue;
            }
            storeId = newStore[0].id;
        }

        let status = 'AVAILABLE';
        let stockCount = 0;
        let price = 15000;

        if (store.name === '강남 초코하우스') { stockCount = 120; }
        else if (store.name === '홍대 쿠키팩토리') { stockCount = 35; }
        else if (store.name === '신사 디저트랩') { stockCount = 8; }
        else if (store.name === '연남동 초코빌리지') { status = 'SOLD_OUT'; stockCount = 0; }
        else if (store.name === '역삼 스위트홈') { stockCount = 65; }

        const productData = {
            store_id: storeId,
            status: status,
            stock_count: stockCount,
            price: price,
            last_check_time: new Date().toISOString()
        };

        const { data: existingProduct } = await supabase.from('products').select('id').eq('store_id', storeId).maybeSingle();

        if (existingProduct) {
            await supabase.from('products').update(productData).eq('store_id', storeId);
        } else {
            await supabase.from('products').insert(productData);
        }
    }

    console.log("Seeding complete!");
}

seedMore();
