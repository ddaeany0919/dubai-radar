import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock } from 'lucide-react';

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
            <div className="text-center py-8 text-gray-500">
                <p className="text-sm">아직 사장님이 올린 소식이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Section Header with Stock Badge */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="flex-shrink-0 w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <h3 className="text-base font-bold text-gray-900">사장님의 최근 소식</h3>

                {/* Stock Count Badge */}
                {stockCount !== undefined && stockCount > 0 && (
                    <div className="ml-auto bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        재고 {stockCount}개
                    </div>
                )}
            </div>

            {posts.map((post) => {
                const hasPhotos = post.photos && post.photos.length > 0;

                return (
                    <div
                        key={post.id}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                    >
                        {/* Header with badges */}
                        <div className="p-4 pb-3 flex items-center gap-2 border-b border-gray-50">
                            {/* Owner Badge */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                사장님 인증
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatTimeAgo(post.created_at)}</span>
                            </div>
                        </div>

                        {/* Content Text */}
                        {post.content && (
                            <div className="px-4 pt-3 pb-2">
                                <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                                    {post.content}
                                </p>
                            </div>
                        )}

                        {/* Horizontal Photo Scroll Gallery (48x48) */}
                        {hasPhotos && (
                            <div className="px-4 pb-4">
                                <div className="flex gap-2 overflow-x-auto">
                                    {post.photos.map((photo, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100"
                                        >
                                            <img
                                                src={photo}
                                                alt={`Photo ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {post.photos.length > 1 && (
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        ← 스와이프하여 {post.photos.length}장 모두 보기
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
