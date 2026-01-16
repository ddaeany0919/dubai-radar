import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

interface OwnerPostEditorProps {
    storeId: number;
    onPostCreated: () => void;
}

export default function OwnerPostEditor({ storeId, onPostCreated }: OwnerPostEditorProps) {
    const [content, setContent] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('파일 선택 이벤트 발생!', e.target.files);

        const files = Array.from(e.target.files || []);
        console.log('선택된 파일 수:', files.length);

        if (files.length + photos.length > 5) {
            alert('최대 5장까지 업로드 가능합니다.');
            return;
        }

        setPhotos([...photos, ...files]);
        console.log('photos 상태 업데이트:', files);

        // 미리보기 생성
        files.forEach((file, index) => {
            console.log(`파일 ${index + 1} 읽기 시작:`, file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                console.log(`파일 ${index + 1} 읽기 완료`);
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.onerror = (error) => {
                console.error(`파일 ${index + 1} 읽기 실패:`, error);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const uploadPhotos = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (const photo of photos) {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${storeId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('store-photos')
                .upload(filePath, photo);

            if (error) {
                console.error('Photo upload error:', error);
                continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('store-photos')
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmit = async () => {
        if (!content.trim() && photos.length === 0) {
            alert('내용 또는 사진을 입력해주세요.');
            return;
        }

        setUploading(true);
        console.log('포스트 등록 시작...');

        try {
            // 1. Upload photos
            console.log(`사진 ${photos.length}장 업로드 중...`);
            const photoUrls = await uploadPhotos();
            console.log('업로드된 사진 URLs:', photoUrls);

            // 2. Get user (or use dev dummy)
            let userId: string;
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Dev Mode: Use dummy UUID
                userId = '00000000-0000-0000-0000-000000000001';
                console.warn('⚠️ Dev Mode: 인증 우회 (더미 사용자)');
            } else {
                userId = user.id;
                console.log('인증된 사용자:', userId);
            }

            // 3. Delete old posts for this store (keep only the latest)
            console.log('기존 포스트 삭제 중...');
            const { error: deleteError } = await supabase
                .from('store_posts')
                .delete()
                .eq('store_id', storeId);

            if (deleteError) {
                console.warn('기존 포스트 삭제 실패 (무시):', deleteError);
            }

            // 4. Create new post
            console.log('새 포스트 생성 중...');
            const { data, error } = await supabase
                .from('store_posts')
                .insert({
                    store_id: storeId,
                    owner_id: userId,
                    content: content.trim(),
                    photos: photoUrls
                });

            if (error) {
                console.error('포스트 생성 에러:', error);
                throw error;
            }

            console.log('포스트 생성 성공:', data);

            // Reset
            setContent('');
            setPhotos([]);
            setPreviews([]);
            alert('포스트가 등록되었습니다! 🎉');
            onPostCreated();

        } catch (error: any) {
            console.error('Post creation error:', error);
            alert(`포스트 등록 실패\n\n에러: ${error.message}\n\n콘솔 확인 (F12)`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                    <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">사장님 포스트 작성</h3>
            </div>

            {/* Text Input */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="재고 상황, 특별 공지, 이벤트 등을 알려주세요! (선택)"
                className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 transition-colors mb-4"
                rows={4}
                maxLength={500}
            />

            {/* Photo Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Photo Upload Button */}
            {photos.length < 5 && (
                <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-4">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600 font-medium">
                        사진 추가 ({photos.length}/5)
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                    />
                </label>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={uploading || (!content.trim() && photos.length === 0)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg border-2 border-transparent hover:border-blue-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                {uploading ? '업로드 중...' : '포스트 등록하기 ✨'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-2">
                * 사진은 제품 인증샷, 매장 사진 등을 올려주세요
            </p>
        </div>
    );
}
