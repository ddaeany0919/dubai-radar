import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Store } from 'lucide-react';

interface StorePost {
    id: number;
    store_id: number;
    owner_id: string;
    content: string;
    photos: string[];
    created_at: string;
}

interface StorePostsGalleryProps {
    storeId: number;
    stockCount?: number;
}

export default function StorePostsGallery({ storeId, stockCount }: StorePostsGalleryProps) {
    const [posts, setPosts] = useState<StorePost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [storeId]);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('store_posts')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const createdAt = new Date(dateString);
        const diffMs = now.getTime() - createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return createdAt.toLocaleDateString('ko-KR');
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800/30 rounded-[35px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">아직 사장님이 올린 소식이 없습니다.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">입고 소식이 들리면 알려드릴게요!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-[#22C55E] to-blue-500 rounded-full"></div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 italic uppercase tracking-tighter">News Feed</h3>

                {stockCount !== undefined && stockCount > 0 && (
                    <div className="ml-auto flex items-center gap-2 bg-green-500/10 dark:bg-green-500/20 px-4 py-1.5 rounded-2xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-green-600 dark:text-green-400">현장 재고 {stockCount}개</span>
                    </div>
                )}
            </div>

            {posts.map((post) => {
                const hasPhotos = post.photos && post.photos.length > 0;

                return (
                    <div
                        key={post.id}
                        className="bg-white dark:bg-gray-800/50 rounded-[35px] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm transition-all"
                    >
                        {/* Header */}
                        <div className="p-5 pb-0 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-tr from-[#22C55E] to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-gray-100">가게 사장님</p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatTimeAgo(post.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-xl">
                                OFFICIAL
                            </span>
                        </div>

                        {/* Content Text */}
                        {post.content && (
                            <div className="p-5 pt-4">
                                <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
                                    {post.content}
                                </p>
                            </div>
                        )}

                        {/* Photo Gallery */}
                        {hasPhotos && (
                            <div className="px-5 pb-5">
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                                    {post.photos.map((photo, idx) => (
                                        <button
                                            key={idx}
                                            className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm active:scale-95 transition-all"
                                        >
                                            <img
                                                src={photo}
                                                alt={`Store news ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                                {post.photos.length > 1 && (
                                    <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-3 font-black uppercase tracking-[0.2em]">
                                        Swipe to discover
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
