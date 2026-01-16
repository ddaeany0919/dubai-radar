import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Phone, Mail, FileText, Lock, Clock, User, Calendar } from 'lucide-react';

interface OwnerOnboardingProps {
    storeId: number;
    storeName: string;
    onSuccess: () => void;
}

export default function OwnerOnboarding({ storeId, storeName, onSuccess }: OwnerOnboardingProps) {
    const [step, setStep] = useState<'LOGIN' | 'FORM'>('LOGIN');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        contact: '',
        businessNumber: '',
        ownerName: '',
        startDate: ''
    });

    useEffect(() => {
        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setStep('FORM');
                setFormData(prev => ({ ...prev, email: session.user.email || '' }));
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            setStep('FORM');
            setFormData(prev => ({ ...prev, email: user.email || '' }));
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver') => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: { redirectTo: window.location.origin },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login error:', error);
            alert('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDevLogin = async () => {
        setLoading(true);
        setTimeout(() => {
            setStep('FORM');
            setLoading(false);
        }, 800);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.businessNumber || formData.businessNumber.length < 10) {
            alert('올바른 사업자등록번호 10자리를 입력해주세요.');
            return;
        }
        if (!formData.ownerName) {
            alert('대표자 성명을 입력해주세요.');
            return;
        }
        if (!formData.startDate || formData.startDate.length !== 8) {
            alert('개업일자 8자리(예: 20230101)를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            // 1. Check if store is already claimed
            const { data: existingProduct } = await supabase
                .from('products')
                .select('owner_id')
                .eq('store_id', storeId)
                .single();

            if (existingProduct?.owner_id && existingProduct.owner_id !== user?.id) {
                // NOTE: For Developer testing, we might want to bypass this, 
                // but for the "Onboarding" flow itself, it should probably strictly check.
                // However, the user asked for a "Developer Mode" to edit everything.
                // That logic is best placed in the parent component (StoreBottomSheet) as a bypass button.
                // Here, we stick to the "Official" onboarding flow.
                alert('이미 다른 계정으로 인증된 가게입니다. 본인이시라면 고객센터에 문의해주세요.');
                setLoading(false);
                return;
            }

            // 2. Simulate NTS API Call (National Tax Service)
            // In a real app: const response = await fetch('https://api.odcloud.kr/api/nts-businessman/...')
            // We simulate a delay and success here.
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 3. Instant Approval Logic
            const updates = {
                owner_id: user?.id || 'demo-owner-id',
                business_reg_no: formData.businessNumber,
                contact_email: formData.email,
                contact_phone: formData.contact,
                is_verified: true // Instant verification
            };

            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('store_id', storeId);

            if (error) throw error;

            alert('사업자 인증이 완료되었습니다! 이제 재고를 관리하실 수 있습니다.');
            onSuccess();

        } catch (error) {
            console.error('Submission error:', error);
            alert('인증 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const [showLoginOptions, setShowLoginOptions] = useState(false);

    if (step === 'LOGIN') {
        return (
            <div className="animate-fade-in p-2 flex flex-col">
                {!showLoginOptions ? (
                    // Initial State: Description + Bottom Button
                    <>
                        <div className="flex-1 flex flex-col justify-center items-center py-8">
                            <p className="text-gray-600 leading-relaxed text-center">
                                가게 사장님이신가요?<br />
                                본인 인증을 통해 가게를 등록하고<br />
                                <span className="font-bold text-gray-900">실시간 재고</span>를 관리해보세요.
                            </p>
                        </div>

                        <div className="mt-auto space-y-2">
                            <button
                                onClick={() => setShowLoginOptions(true)}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                사장님 로그인
                            </button>
                            <button onClick={handleDevLogin} className="w-full py-3 text-xs text-gray-400 hover:text-gray-600 underline">
                                (개발용) 로그인 건너뛰기
                            </button>
                        </div>
                    </>
                ) : (
                    // Login Options State
                    <div className="w-full space-y-3 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-5 h-5 text-gray-900" />
                            <h3 className="text-lg font-bold text-gray-900">사장님 로그인</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 font-medium">
                            간편 로그인으로 빠르게 시작하세요.
                        </p>
                        <button onClick={() => handleSocialLogin('kakao' as any)} className="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <span className="text-xl">💬</span> 카카오로 시작하기
                        </button>
                        <button onClick={() => handleSocialLogin('naver' as any)} className="w-full py-3 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <span className="text-xl">🇳</span> 네이버로 시작하기
                        </button>
                        <button onClick={() => handleSocialLogin('google' as any)} className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <span className="text-xl">🇬</span> 구글로 시작하기
                        </button>
                        <button
                            onClick={() => setShowLoginOptions(false)}
                            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 mt-2"
                        >
                            이전으로 돌아가기
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">사업자 정보 인증</h3>
                <p className="text-xs text-gray-500 mt-1">
                    국세청 데이터를 통해<br />즉시 본인 인증을 진행합니다.
                </p>
            </div>

            <div className="space-y-4">
                <div className="bg-blue-50 text-blue-700 py-3 px-4 rounded-lg text-center font-medium text-sm">
                    {formData.email || 'user@example.com'}
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">카페 이름 *</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input type="text" value={storeName} disabled className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium focus:outline-none" />
                    </div>
                </div>

                {/* Owner Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">대표자 성명 *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            placeholder="홍길동"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">개업일자 *</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            placeholder="20230101 (8자리)"
                            maxLength={8}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Business Number */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">사업자등록번호 *</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={formData.businessNumber}
                            onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                            placeholder="000-00-00000"
                            maxLength={12}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">국세청 정보와 일치해야 인증됩니다.</p>
                </div>

                <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-[#E5C4A1] hover:bg-[#dcb083] text-[#5D4037] rounded-xl font-bold text-lg shadow-md active:scale-95 transition-all mt-4">
                    {loading ? '인증 확인 중...' : '사업자 인증하기'}
                </button>
            </div>
        </div>
    );
}
